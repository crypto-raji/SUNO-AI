import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/services/admin/getAdminUser";
import { serviceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAdminUser();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = serviceClient();

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();

  // Run aggregate queries in parallel
  const [
    { count: totalUsers },
    { count: totalSessions },
    { count: totalMessages },
    { count: totalDocuments },
    { count: totalAudioFiles },
    { count: activeUsers7d },
    { count: activeUsers30d },
    { data: appSettings },
    { data: usageRows },
    { data: sessionsData },
    { data: documentsData },
    { data: audioData },
    { data: referralRows },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("sessions").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("audio_files").select("id", { count: "exact", head: true }),
    supabase.from("sessions").select("user_id", { count: "exact", head: true }).gte("updated_at", sevenDaysAgo),
    supabase.from("sessions").select("user_id", { count: "exact", head: true }).gte("updated_at", thirtyDaysAgo),
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("usage").select("service, characters, tokens, created_at").gte("created_at", thirtyDaysAgo).limit(10000),
    supabase.from("sessions").select("mode").limit(5000),
    supabase.from("documents").select("status").limit(5000),
    supabase.from("audio_files").select("status").limit(5000),
    supabase.from("referrals").select("referrer_id, profiles!referrals_referrer_id_fkey(username, email)"),
  ]);

  // Usage by service
  const usageByService: Record<string, { characters: number; tokens: number; calls: number }> = {
    ai_groq: { characters: 0, tokens: 0, calls: 0 },
    stt_assemblyai: { characters: 0, tokens: 0, calls: 0 },
  };

  let totalTokens = 0;
  let totalCharacters = 0;
  let totalApiCalls = 0;

  for (const row of usageRows ?? []) {
    const s = row.service;
    if (!usageByService[s]) {
      usageByService[s] = { characters: 0, tokens: 0, calls: 0 };
    }
    const c = row.characters ?? 0;
    const t = row.tokens ?? 0;
    usageByService[s].characters += c;
    usageByService[s].tokens += t;
    usageByService[s].calls += 1;

    totalTokens += t;
    totalCharacters += c;
    totalApiCalls += 1;
  }

  // Session mode distribution
  const modeDistribution: Record<string, number> = {
    general: 0,
    student: 0,
    business: 0,
    creator: 0,
    reading: 0,
  };
  for (const row of sessionsData ?? []) {
    if (row.mode) {
      modeDistribution[row.mode] = (modeDistribution[row.mode] ?? 0) + 1;
    }
  }

  // Document status counts
  const documentStatuses = (documentsData ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  // Audio status counts
  const audioStatuses = (audioData ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  // Referrals leaderboard
  const referralTally: Record<string, { count: number; name: string }> = {};
  for (const r of referralRows ?? []) {
    const id = r.referrer_id;
    if (!id) continue;
    if (!referralTally[id]) {
      const profile = (r as unknown as { profiles: { username?: string; email?: string } | null }).profiles;
      const name = profile?.username ? `@${profile.username}` : profile?.email ?? "User";
      referralTally[id] = { count: 0, name };
    }
    referralTally[id].count += 1;
  }

  const topReferrers = Object.entries(referralTally)
    .map(([id, info]) => ({ id, name: info.name, count: info.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({
    metrics: {
      totalUsers: totalUsers ?? 0,
      activeUsers7d: activeUsers7d ?? 0,
      activeUsers30d: activeUsers30d ?? 0,
      totalSessions: totalSessions ?? 0,
      totalMessages: totalMessages ?? 0,
      totalDocuments: totalDocuments ?? 0,
      totalAudioFiles: totalAudioFiles ?? 0,
      totalTokens,
      totalCharacters,
      totalApiCalls,
    },
    usageByService,
    modeDistribution,
    documentStatuses,
    audioStatuses,
    topReferrers,
    appSettings: {
      maintenanceMode: appSettings?.maintenance_mode ?? false,
      maintenanceMessage: appSettings?.maintenance_message ?? "",
    },
  });
}
