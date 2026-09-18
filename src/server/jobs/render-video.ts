import { inngest } from "./inngest";
import { db } from "@/lib/supabase";
import { runRenderTemplate } from "@/server/render/template";
import { uploadToCloudinary } from "@/lib/cloudinary";
import * as fs from "fs/promises";

export const renderVideo = inngest.createFunction(
  {
    id: "render-video",
    name: "Render TikTok Video",
    retries: 2,
    concurrency: { limit: 3 },
  },
  { event: "video/render.requested" },
  async ({ event, step }) => {
    const { render_id, project_id, instructions } = event.data as {
      render_id: string;
      project_id: string;
      instructions: Record<string, string>;
    };

    // Mark as processing
    await step.run("mark-processing", async () => {
      await db()
        .from("video_renders")
        .update({ status: "processing", started_at: new Date().toISOString() })
        .eq("id", render_id);
    });

    // Run FFmpeg template
    const outputPath = await step.run("ffmpeg-render", async () => {
      return runRenderTemplate({
        renderId: render_id,
        selfieUrl: instructions.selfie_url,
        hookText: instructions.hook_text,
        ctaText: instructions.cta_text,
        locale: instructions.locale as "am" | "en",
        resolution: (instructions.resolution as "1080x1920" | "720x1280") ?? "1080x1920",
      });
    });

    // Upload final MP4 to Cloudinary
    const cloudinaryResult = await step.run("upload-output", async () => {
      const buffer = await fs.readFile(outputPath);
      const result = await uploadToCloudinary(buffer, {
        folder: `tiktok-creator/renders/${project_id}`,
        resourceType: "video",
        tags: ["final", "render"],
      });
      await fs.unlink(outputPath).catch(() => {});
      return result;
    });

    // Record final asset + mark render ready
    await step.run("mark-ready", async () => {
      await db().from("video_assets").insert({
        project_id,
        asset_type: "final",
        cloudinary_url: cloudinaryResult.secureUrl,
        public_id: cloudinaryResult.publicId,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        size_bytes: cloudinaryResult.bytes,
      });

      await db()
        .from("video_renders")
        .update({
          status: "ready",
          output_url: cloudinaryResult.secureUrl,
          completed_at: new Date().toISOString(),
        })
        .eq("id", render_id);

      await db()
        .from("video_projects")
        .update({ status: "ready" })
        .eq("id", project_id);
    });

    return { render_id, output_url: cloudinaryResult.secureUrl };
  }
);
