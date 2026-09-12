import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/services/admin/getAdminUser";
import { serviceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await getAdminUser();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const role = searchParams.get("role") || "all"; // 'all' | 'admin' | 'user'
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
  const offset = (page - 1) * limit;

  const supabase = serviceClient();

  let query = supabase.from("profiles").select("*", { count: "exact" });

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,name.ilike.%${search}%`);
  }

  if (role === "admin") {
    query = query.eq("is_admin", true);
  } else if (role === "user") {
    query = query.eq("is_admin", false);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data: users, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get referral counts for these users
  const userIds = (users ?? []).map((u) => u.id);
  let referralCounts: Record<string, number> = {};
  let usageTotals: Record<string, { tokens: number; characters: number }> = {};

  if (userIds.length > 0) {
    const [{ data: refData }, { data: usageData }] = await Promise.all([
      supabase.from("referrals").select("referrer_id").in("referrer_id", userIds),
      supabase.from("usage").select("user_id, tokens, characters").in("user_id", userIds),
    ]);

    referralCounts = (refData ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.referrer_id] = (acc[r.referrer_id] ?? 0) + 1;
      return acc;
    }, {});

    usageTotals = (usageData ?? []).reduce<Record<string, { tokens: number; characters: number }>>((acc, u) => {
      if (!acc[u.user_id]) acc[u.user_id] = { tokens: 0, characters: 0 };
      acc[u.user_id].tokens += u.tokens ?? 0;
      acc[u.user_id].characters += u.characters ?? 0;
      return acc;
    }, {});
  }

  const enrichedUsers = (users ?? []).map((u) => ({
    ...u,
    referralCount: referralCounts[u.id] ?? 0,
    usageTokens: usageTotals[u.id]?.tokens ?? 0,
    usageCharacters: usageTotals[u.id]?.characters ?? 0,
  }));

  return NextResponse.json({
    users: enrichedUsers,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
