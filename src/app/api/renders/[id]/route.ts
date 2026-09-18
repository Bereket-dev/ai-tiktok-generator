import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const { data: render, error } = await db()
      .from("video_renders")
      .select(
        "id, status, output_url, preview_url, error_message, updated_at, video_projects!inner(session_id)"
      )
      .eq("id", id)
      .single();

    if (error || !render) {
      return NextResponse.json({ error: "Render not found" }, { status: 404 });
    }

    // Verify session ownership via joined project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = (render as any).video_projects;
    if (project?.session_id !== sessionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      render: {
        id: render.id,
        status: render.status,
        output_url: render.output_url,
        preview_url: render.preview_url,
        error_message: render.error_message,
        updated_at: render.updated_at,
      },
    });
  } catch (err) {
    console.error("[api/renders/[id]] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
