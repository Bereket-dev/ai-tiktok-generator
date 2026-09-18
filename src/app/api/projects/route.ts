import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/supabase";

const bodySchema = z.object({
  prompt_key: z.string().min(1),
  locale: z.enum(["am", "en"]),
  session_id: z.string().min(1),
  source_rights_confirmed: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt_key, locale, session_id, source_rights_confirmed } = parsed.data;

    const { data, error } = await db()
      .from("video_projects")
      .insert({ prompt_key, locale, session_id, source_rights_confirmed, status: "draft" })
      .select()
      .single();

    if (error) {
      console.error("[api/projects] Supabase error:", error);
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (err) {
    console.error("[api/projects] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
