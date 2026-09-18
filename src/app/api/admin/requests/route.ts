import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

// Simple token auth — set ADMIN_SECRET in env
function isAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  return token === process.env.ADMIN_SECRET;
}

// GET /api/admin/requests — list all generation requests
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

  return NextResponse.json({ requests: data });
}
