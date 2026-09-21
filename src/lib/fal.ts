/**
 * Funny selfie → generative AI image (free tier only, no payment).
 *
 * Primary: Cloudinary Generative Replace (existing free Cloudinary account)
 * Fallback: Pollinations.ai (no API key)
 * Optional: Google Gemini 2.5 Flash Image via free AI Studio key (best likeness)
 *
 * Not a photo filter — the selfie is rewritten by generative AI.
 */

import { cloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import {
  pickRandomStyle,
  type FunnyStyle,
} from "@/lib/funny-styles";

/**
 * Keep these SHORT — Cloudinary gen_replace URL length is limited;
 * long `to_` strings return HTTP 400.
 */
const STYLE_TO: Record<FunnyStyle, string> = {
  caricature:
    "a hilarious exaggerated cartoon caricature with giant goofy grin and huge head",
  pixar_chaos:
    "a funny Pixar style 3D cartoon with oversized head and ridiculous expression",
  meme_legend:
    "an absurd internet meme portrait with extreme exaggerated emotion",
  superhero_fail:
    "a ridiculous failed superhero comic with tangled cape and funny pose",
  animal_mascot:
    "a goofy sports mascot hybrid with big cartoon eyes and plush suit",
  yearbook_roast:
    "a savage 1990s yearbook roast with awkward pose and laser eyes",
};

export interface GenerateResult {
  imageUrl: string;
  style: FunnyStyle;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function waitForImageUrl(url: string, attempts = 36): Promise<Buffer> {
  let lastErr = "timeout";
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      const buf = Buffer.from(await res.arrayBuffer());

      if (res.status === 423) {
        await sleep(2500);
        continue;
      }

      if (!res.ok) {
        const body = buf.toString("utf8").slice(0, 280);
        lastErr = `HTTP ${res.status}: ${body}`;
        // Non-retryable client errors (except 423 handled above)
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`Cloudinary gen_replace failed: ${lastErr}`);
        }
      } else if (buf.length > 4000 && buf[0] === 0xff && buf[1] === 0xd8) {
        return buf;
      } else {
        lastErr = `HTTP ${res.status} (${buf.length} bytes, not JPEG)`;
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Cloudinary gen_replace failed:")) {
        throw e;
      }
      lastErr = errMsg(e);
    }
    await sleep(2500);
  }
  throw new Error(`Cloudinary gen image not ready: ${lastErr}`);
}

/**
 * Free Cloudinary Generative Replace via signed delivery URL.
 * (uploader.explicit eager rejects gen_replace — use URL delivery instead.)
 */
async function generateWithCloudinary(
  publicId: string,
  style: FunnyStyle
): Promise<Buffer> {
  const to = STYLE_TO[style];
  const url = cloudinary.url(publicId, {
    transformation: [
      { width: 1024, height: 1024, crop: "fill", gravity: "face" },
      { effect: `gen_replace:from_the person;to_${to}` },
    ],
    sign_url: true,
  });

  return waitForImageUrl(url);
}

/** Optional free Google AI Studio key — better full redraws. */
async function generateWithGemini(
  selfieUrl: string,
  style: FunnyStyle,
  apiKey: string
): Promise<Buffer> {
  const selfieRes = await fetch(selfieUrl);
  if (!selfieRes.ok) throw new Error("Failed to download selfie for Gemini");
  const selfieBytes = Buffer.from(await selfieRes.arrayBuffer());
  const mimeType =
    selfieRes.headers.get("content-type")?.split(";")[0] || "image/jpeg";

  const prompt = [
    `Completely redraw this selfie as: ${STYLE_TO[style]}.`,
    "Keep the same person recognizable but make it absurdly funny.",
    "Square 1:1, face-centered, AI illustration, NOT a photo filter.",
    "No text, watermark, or border.",
  ].join(" ");

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

  const res = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: selfieBytes.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 280)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string };
          inline_data?: { data?: string };
        }>;
      };
    }>;
  };

  for (const part of json.candidates?.[0]?.content?.parts ?? []) {
    const data = part.inlineData?.data ?? part.inline_data?.data;
    if (data) return Buffer.from(data, "base64");
  }
  throw new Error("Gemini did not return an image");
}

/** Free Pollinations img2img — last-resort fallback. */
async function generateWithPollinations(
  selfieUrl: string,
  style: FunnyStyle
): Promise<Buffer> {
  const prompt = [
    STYLE_TO[style],
    "extreme comedy cartoon AI art of this exact person",
    "NOT photorealistic",
    "NOT a filter",
    "bold exaggerated features",
    "no watermark",
  ].join(", ");

  const params = new URLSearchParams({
    width: "1024",
    height: "1024",
    model: "microsoft/mai-image-2.5-flash",
    image: selfieUrl,
    nologo: "true",
    enhance: "true",
    seed: String(Math.floor(Math.random() * 1_000_000_000)),
  });

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
  const res = await fetch(url, {
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Pollinations ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4000 || buf[0] !== 0xff) {
    throw new Error("Pollinations did not return an image");
  }
  return buf;
}

export interface GenerateInput {
  selfieUrl: string;
  publicId: string;
  style?: FunnyStyle;
}

/**
 * Generate a funny AI rewrite of the selfie and store it on Cloudinary.
 */
export async function generateFunnyImage(
  input: GenerateInput
): Promise<GenerateResult> {
  const chosenStyle = input.style ?? pickRandomStyle();
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    "";

  // Default: Cloudinary gen_replace (free, proven funny rewrite).
  // Optional: Gemini when a free AI Studio key is set (tried first).
  // Last resort: Pollinations (often too photorealistic).
  const attempts: Array<{ name: string; run: () => Promise<Buffer> }> = [];

  if (geminiKey) {
    attempts.push({
      name: "gemini",
      run: () => generateWithGemini(input.selfieUrl, chosenStyle, geminiKey),
    });
  }
  attempts.push({
    name: "cloudinary",
    run: () => generateWithCloudinary(input.publicId, chosenStyle),
  });
  attempts.push({
    name: "pollinations",
    run: () => generateWithPollinations(input.selfieUrl, chosenStyle),
  });

  let imageBuffer: Buffer | null = null;
  let used = "";
  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      imageBuffer = await attempt.run();
      used = attempt.name;
      break;
    } catch (err) {
      const msg = errMsg(err);
      console.warn(`[funny-image] ${attempt.name} failed:`, msg);
      errors.push(`${attempt.name}: ${msg}`);
    }
  }

  if (!imageBuffer) {
    throw new Error(`All free AI generators failed: ${errors.join(" | ")}`);
  }

  console.log(`[funny-image] ok via ${used} style=${chosenStyle}`);

  const uploaded = await uploadToCloudinary(imageBuffer, {
    folder: "tiktok-creator/funny",
    resourceType: "image",
    tags: ["funny", chosenStyle, used],
  });

  return { imageUrl: uploaded.secureUrl, style: chosenStyle };
}
