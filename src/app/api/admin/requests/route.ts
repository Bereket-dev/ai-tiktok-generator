import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  return token === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");

  let query = db()
    .from("generation_requests")
    .select("id, session_id, selfie_url, result_url, style, status, unlocked, admin_note, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const sessionIds = [...new Set((data ?? []).map((r: { session_id: string }) => r.session_id))];
  let bannedSet = new Set<string>();

  if (sessionIds.length > 0) {
    const { data: banned } = await db()
      .from("banned_devices")
      .select("session_id")
      .in("session_id", sessionIds);
    bannedSet = new Set((banned ?? []).map((b: { session_id: string }) => b.session_id));
  }

  const requests = (data ?? []).map((r: { session_id: string }) => ({
    ...r,
    banned: bannedSet.has(r.session_id),
  }));

  return NextResponse.json({ requests });
}
