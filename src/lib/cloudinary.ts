import { v2 as cloudinary } from "cloudinary";

// Configure once on import (server-only module)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  durationSeconds: number | null;
  bytes: number;
  format: string;
}

/**
 * Upload a raw video/image Buffer to Cloudinary.
 * Used server-side only from /api/upload route.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    resourceType?: "video" | "image" | "raw" | "auto";
    publicId?: string;
    tags?: string[];
  }
): Promise<UploadResult> {
  const { folder, resourceType = "video", publicId, tags } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: resourceType,
      overwrite: true,
      tags,
    };
    if (publicId) uploadOptions.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width ?? 0,
          height: result.height ?? 0,
          durationSeconds: (result as { duration?: number }).duration ?? null,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Generate a signed upload URL for direct browser → Cloudinary uploads.
 * Returns params the browser can POST to Cloudinary directly.
 */
export function generateSignedUploadParams(folder: string): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
} {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}

/**
 * Delete a Cloudinary asset by public ID.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "video" | "image" | "raw" = "video"
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
