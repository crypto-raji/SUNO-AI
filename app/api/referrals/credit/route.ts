import { NextRequest, NextResponse } from "next/server";
import { creditReferral } from "@/lib/services/referrals";

export async function POST(req: NextRequest) {
  try {
    const { userId, referralCode } = await req.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await creditReferral(userId, referralCode ?? null);
    return NextResponse.json({ ok: true });
  } catch {
    // Referral crediting is best-effort and must never block signup.
    return NextResponse.json({ ok: true });
  }
}
