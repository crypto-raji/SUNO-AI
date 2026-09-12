import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

const DEFAULT_SUPABASE_URL = "https://znxoktfzeprragrgkmtj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueG9rdGZ6ZXBycmFncmdrbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNjY0ODIsImV4cCI6MjEwNDc0MjQ4Mn0.36UmvmvlrSBTsljPcHriJdpBM89A_ENz1-sFY3rvrgA";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return createBrowserClient(url, anonKey);
}
