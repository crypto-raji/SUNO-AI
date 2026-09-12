import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

/**
 * Server-side client, scoped to the signed-in user via their session cookie.
 * Respects Row Level Security — use this everywhere except the isolated
 * admin/service operations that explicitly need serviceClient() below.
 */
const DEFAULT_SUPABASE_URL = "https://znxoktfzeprragrgkmtj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueG9rdGZ6ZXBycmFncmdrbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNjY0ODIsImV4cCI6MjEwNDc0MjQ4Mn0.36UmvmvlrSBTsljPcHriJdpBM89A_ENz1-sFY3rvrgA";

export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component with no request context — safe to ignore,
            // middleware refreshes the session cookie on the next request.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}

/**
 * Service-role client. Bypasses RLS entirely.
 * ONLY use for operations that must cross user boundaries by design:
 * referral crediting, admin dashboard aggregates, usage metering writes,
 * app_settings updates. Never call this on behalf of a single user's own
 * reads/writes — use createClient() for that so RLS stays the enforcement
 * boundary, not application code.
 */
export function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );
}
