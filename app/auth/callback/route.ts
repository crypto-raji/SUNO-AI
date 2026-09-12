import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { creditReferral } from "@/lib/services/referrals";

export async function GET(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    new URL(request.url).host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.includes("0.0.0.0") ? "http" : "https");

  // Fallback to NEXT_PUBLIC_APP_URL or active public host
  let publicOrigin = `${proto}://${host}`;
  if (publicOrigin.includes("0.0.0.0") && process.env.NEXT_PUBLIC_APP_URL) {
    publicOrigin = process.env.NEXT_PUBLIC_APP_URL;
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/app";
  // Safe redirect path validation: prevent open redirect to external domains
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";

  if (code) {
    const response = NextResponse.redirect(new URL(next, publicOrigin));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://znxoktfzeprragrgkmtj.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueG9rdGZ6ZXBycmFncmdrbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTc4MTQsImV4cCI6MjA4ODg5MzgxNH0.oW2l_013s420J97F1QGj-qE97r8H6N4fL4R0v0U9E2U";

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const referralCode = searchParams.get("ref") || request.cookies.get("sona_ref")?.value;
      if (referralCode) {
        await creditReferral(data.user.id, referralCode);
        response.cookies.delete("sona_ref");
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL(`/login?error=oauth_failed`, publicOrigin));
}
