import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { generateFunnyImage } from "@/lib/fal";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const selfieFile = formData.get("selfie") as File | null;
    const sessionId = formData.get("session_id") as string | null;

    if (!selfieFile || !sessionId) {
      return NextResponse.json({ error: "Missing selfie or session_id" }, { status: 400 });
    }

    // 1. Upload selfie to Cloudinary
    const buffer = Buffer.from(await selfieFile.arrayBuffer());
    const selfieUpload = await uploadToCloudinary(buffer, {
      folder: "tiktok-creator/selfies",
      resourceType: "image",
      tags: ["selfie", sessionId],
    });

    // 2. Generate funny image URL via Cloudinary transformations (free, instant)
    const { imageUrl, style } = generateFunnyImage(selfieUpload.publicId);

    // 3. Save generation request as "ready" immediately
    const { data: request, error: insertError } = await db()
      .from("generation_requests")
      .insert({
        session_id: sessionId,
        selfie_url: selfieUpload.secureUrl,
        selfie_public_id: selfieUpload.publicId,
        result_url: imageUrl,
        style,
        status: "ready",
      })
      .select()
      .single();

    if (insertError || !request) {
      console.error("[api/generate] insert error:", insertError);
      return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
    }

    return NextResponse.json({ request_id: request.id }, { status: 201 });
  } catch (err) {
    console.error("[api/generate] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
