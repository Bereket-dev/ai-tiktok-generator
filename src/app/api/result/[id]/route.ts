import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("generation_requests")
    .select("id, status, style, unlocked, result_url, created_at")
    .eq("id", id)
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Never expose result_url unless admin has approved (unlocked)
  return NextResponse.json({
    id: data.id,
    status: data.status,
    style: data.style,
    unlocked: data.unlocked,
    // Only send result_url when unlocked by admin
    result_url: data.unlocked ? data.result_url : null,
  });
}
