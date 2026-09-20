import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  return token === process.env.ADMIN_SECRET;
}

// POST /api/admin/requests/[id]/action
// body: { action: "approve" | "reject" | "ban", note?: string, session_id?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action, note, session_id: sessionIdFromBody } = body;

  if (action !== "approve" && action !== "reject" && action !== "ban") {
    return NextResponse.json(
      { error: "action must be approve, reject, or ban" },
      { status: 400 }
    );
  }

  if (action === "approve") {
    const { error } = await db()
      .from("generation_requests")
      .update({ status: "approved", unlocked: true, admin_note: note ?? null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
    return NextResponse.json({ ok: true, action });
  }

  if (action === "reject") {
    const { error } = await db()
      .from("generation_requests")
      .update({ status: "rejected", unlocked: false, admin_note: note ?? null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
    return NextResponse.json({ ok: true, action });
  }

  // ban — reject this request + ban the device session
  const { data: existing } = await db()
    .from("generation_requests")
    .select("session_id")
    .eq("id", id)
    .single();

  const sessionId = sessionIdFromBody || existing?.session_id;
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required to ban" }, { status: 400 });
  }

  const { error: updateError } = await db()
    .from("generation_requests")
    .update({ status: "rejected", unlocked: false, admin_note: note ?? "Device banned" })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: "DB error" }, { status: 500 });

  await db()
    .from("banned_devices")
    .upsert({ session_id: sessionId, reason: note ?? "Banned by admin" });

  // Reject any other pending/requested items from same device
  await db()
    .from("generation_requests")
    .update({ status: "rejected", unlocked: false })
    .eq("session_id", sessionId)
    .in("status", ["pending", "processing", "ready", "unlock_requested"]);

  return NextResponse.json({ ok: true, action: "ban", session_id: sessionId });
}
