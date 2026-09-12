import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSTTConfigured, createStreamingToken } from "@/lib/services/stt/assemblyai";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSTTConfigured()) {
    return NextResponse.json(
      { error: "Speech-to-text is not configured. Please set ASSEMBLYAI_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const token = await createStreamingToken();
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate real-time audio token." },
      { status: 500 }
    );
  }
}
