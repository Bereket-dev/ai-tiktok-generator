import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/supabase";
import { inngest } from "@/server/jobs/inngest";
import { getPromptPack } from "@/lib/prompts";
import type { PromptKey } from "@/lib/prompts";
import type { SupportedLocale } from "@/i18n";

const bodySchema = z.object({
  project_id: z.string().uuid(),
  session_id: z.string().min(1),
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

    const { project_id, session_id } = parsed.data;

    // Fetch project (verify ownership)
    const { data: project, error: projectError } = await db()
      .from("video_projects")
      .select("*")
      .eq("id", project_id)
      .eq("session_id", session_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch selfie asset URL
    const { data: assets } = await db()
      .from("video_assets")
      .select("cloudinary_url")
      .eq("project_id", project_id)
      .eq("asset_type", "selfie")
      .limit(1);

    const selfieUrl = assets?.[0]?.cloudinary_url ?? null;
    if (!selfieUrl) {
      return NextResponse.json({ error: "No selfie uploaded yet" }, { status: 400 });
    }

    // Build render instructions from prompt pack
    const pack = getPromptPack(
      project.prompt_key as PromptKey,
      project.locale as SupportedLocale
    );
    const instructions = {
      selfie_url: selfieUrl,
      prompt_key: project.prompt_key,
      locale: project.locale,
      hook_text: pack.hook,
      caption: pack.caption,
      cta_text: pack.cta,
      end_card_text: pack.endCard,
      template: "v1_9x16",
      resolution: "1080x1920",
    };

    // Create render record
    const { data: render, error: renderError } = await db()
      .from("video_renders")
      .insert({ project_id, status: "queued", instructions })
      .select()
      .single();

    if (renderError || !render) {
      console.error("[api/render] Failed to create render:", renderError);
      return NextResponse.json({ error: "Failed to queue render" }, { status: 500 });
    }

    // Enqueue Inngest event
    await inngest.send({
      name: "video/render.requested",
      data: { render_id: render.id, project_id, instructions },
    });

    // Update project status
    await db()
      .from("video_projects")
      .update({ status: "processing" })
      .eq("id", project_id);

    return NextResponse.json({ render }, { status: 201 });
  } catch (err) {
    console.error("[api/render] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
