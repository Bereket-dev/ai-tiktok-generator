import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("project_id") as string | null;
    const sessionId = formData.get("session_id") as string | null;

    if (!file || !projectId || !sessionId) {
      return NextResponse.json(
        { error: "Missing file, project_id, or session_id" },
        { status: 400 }
      );
    }

    // Verify project ownership before accepting upload
    const { data: project, error: projectError } = await db()
      .from("video_projects")
      .select("id, status")
      .eq("id", projectId)
      .eq("session_id", sessionId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder: `tiktok-creator/selfies/${projectId}`,
      resourceType: "video",
      tags: ["selfie", sessionId],
    });

    // Record asset in Supabase
    const { error: assetError } = await db().from("video_assets").insert({
      project_id: projectId,
      asset_type: "selfie",
      cloudinary_url: result.secureUrl,
      public_id: result.publicId,
      duration_s: result.durationSeconds,
      width: result.width,
      height: result.height,
      size_bytes: result.bytes,
    });

    if (assetError) {
      console.error("[api/upload] Failed to record asset:", assetError);
    }

    // Update project status
    await db()
      .from("video_projects")
      .update({ status: "queued", source_url: result.secureUrl })
      .eq("id", projectId);

    return NextResponse.json(
      {
        asset: {
          cloudinary_url: result.secureUrl,
          public_id: result.publicId,
          width: result.width,
          height: result.height,
          duration_s: result.durationSeconds,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/upload] Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
