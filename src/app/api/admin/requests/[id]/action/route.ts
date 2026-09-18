import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  const token = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  return token === process.env.ADMIN_SECRET;
}

// POST /api/admin/requests/[id]/action  body: { action: "approve" | "reject", note?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, note } = await req.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const update =
    action === "approve"
      ? { status: "approved", unlocked: true, admin_note: note ?? null }
      : { status: "rejected", unlocked: false, admin_note: note ?? null };

  const { error } = await db()
    .from("generation_requests")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true, action });
}
