import { serviceClient } from "@/lib/supabase/server";

/**
 * Credits a referral after a new user signs up with a referral code.
 * Runs with the service role because it needs to write to a row (the
 * referrer's) that the new user does not own.
 */
export async function creditReferral(newUserId: string, referralCode: string | null) {
  if (!referralCode) return;

  const supabase = serviceClient();

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!referrer) return; // invalid code — silently ignore, don't block signup
  if (referrer.id === newUserId) return; // prevent self-referral

  // referred_user_id has a unique constraint, so a duplicate insert
  // (e.g. retried webhook) fails safely instead of double-crediting.
  const { error } = await supabase.from("referrals").insert({
    referrer_id: referrer.id,
    referred_user_id: newUserId,
    referral_code: referralCode,
  });

  if (error) return;

  await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", newUserId);
}
