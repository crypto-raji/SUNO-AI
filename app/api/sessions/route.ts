import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeWithAI } from "@/lib/services/ai";
import type { Mode } from "@/lib/types/database";

async function generateTitle(seed: string, userId: string): Promise<string> {
  try {
    const result = await completeWithAI(
      {
        system: "Generate a short, specific conversation title (max 6 words). Reply with only the title, no quotes.",
        messages: [{ role: "user", content: seed.slice(0, 500) }],
        maxTokens: 20,
      },
      { userId }
    );
    return result.text.trim().replace(/^"|"$/g, "") || "New conversation";
  } catch {
    // Fall back to a plain truncation if AI isn't configured or fails —
    // never block session creation on the title generator.
    return seed.slice(0, 40) || "New conversation";
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mode, seed } = (await req.json()) as { mode: Mode; seed?: string };

  const title = seed ? await generateTitle(seed, user.id) : "New conversation";

  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, mode, title })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Couldn't start a new conversation. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("id");
  if (!sessionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: session } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ session, messages: messages ?? [] });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("id");
  if (!sessionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("sessions").delete().eq("id", sessionId).eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
