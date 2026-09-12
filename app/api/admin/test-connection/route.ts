import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqProvider } from "@/lib/services/ai/groq";
import { isSTTConfigured } from "@/lib/services/stt/assemblyai";
import { AssemblyAI } from "assemblyai";

type Provider = "groq" | "assemblyai";

async function testGroq() {
  if (!groqProvider.isConfigured()) return { ok: false, error: "Not configured" };
  await groqProvider.complete({ messages: [{ role: "user", content: "Reply with OK." }], maxTokens: 5 });
  return { ok: true };
}

async function testAssemblyAI() {
  if (!isSTTConfigured()) return { ok: false, error: "Not configured" };
  const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });
  await client.transcripts.list({ limit: 1 });
  return { ok: true };
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { provider } = (await req.json()) as { provider: Provider };

  try {
    const result = provider === "groq" ? await testGroq() : await testAssemblyAI();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: "Connection test failed. Check the API key." });
  }
}
