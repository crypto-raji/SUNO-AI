import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listAvailableVoices } from "@/lib/services/tts";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const voices = await listAvailableVoices();
  return NextResponse.json({ voices });
}
