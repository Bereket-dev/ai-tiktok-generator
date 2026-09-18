import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const sessionId = body.session_id as string | undefined;

  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  // Verify ownership
  const { data, error } = await db()
    .from("generation_requests")
    .select("id, status")
    .eq("id", id)
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Mark as unlock-requested so admin sees it in queue
  await db()
    .from("generation_requests")
    .update({ status: "unlock_requested" })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
