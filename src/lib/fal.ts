/**
 * Funny selfie → generative AI image (free tier only, no payment).
 *
 * Identity first: keep the same face/person recognizable.
 * Comedy comes from absurd costumes + silly backgrounds — never replace the face.
 *
 * Primary: Cloudinary clothes replace + background replace (face pixels stay)
 * Optional: Google Gemini 2.5 Flash Image (free AI Studio key)
 * Fallback: Pollinations Kontext img2img (no API key)
 */

import { cloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import {
  pickRandomStyle,
  type FunnyStyle,
} from "@/lib/funny-styles";

/**
 * Clothes-only targets — NEVER face / person / head / eyes.
 * Keep SHORT (Cloudinary URL length limits).
 */
const STYLE_COSTUME: Record<FunnyStyle, string> = {
  caricature: "silly clown suit with big bowtie",
  pixar_chaos: "bright cartoon character costume",
  meme_legend: "absurd meme outfit with foam hands",
  superhero_fail: "tiny failed superhero costume",
  animal_mascot: "plush animal body mascot suit",
  yearbook_roast: "cheesy 90s yearbook tuxedo",
};

/** Silly scene behind the same person — face stays untouched. */
const STYLE_BG: Record<FunnyStyle, string> = {
  caricature: "colorful circus tent",
  pixar_chaos: "toy workshop set",
  meme_legend: "green screen meme wall",
  superhero_fail: "messy comic rooftop",
  animal_mascot: "school sports stadium",
  yearbook_roast: "1990s school photo backdrop",
};

const STYLE_LABEL: Record<FunnyStyle, string> = {
  caricature: "clown-costume roast",
  pixar_chaos: "cartoon-costume roast",
  meme_legend: "meme-outfit roast",
  superhero_fail: "failed-hero costume roast",
  animal_mascot: "mascot-suit roast",
  yearbook_roast: "yearbook-tuxedo roast",
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
 * Free Cloudinary: swap clothes + background only.
 * Face stays the original selfie pixels (best free likeness).
 */
async function generateWithCloudinary(
  publicId: string,
  style: FunnyStyle
): Promise<Buffer> {
  const costume = STYLE_COSTUME[style];
  const bg = STYLE_BG[style];
  const url = cloudinary.url(publicId, {
    transformation: [
      { width: 1024, height: 1024, crop: "fill", gravity: "face" },
      // Replace garments only — preserve body shape so face/pose stay locked
      {
        effect: `gen_replace:from_clothes;to_${costume};preserve-geometry_true`,
      },
      { effect: `gen_background_replace:prompt_${bg}` },
    ],
    sign_url: true,
  });

  return waitForImageUrl(url);
}

/** Optional free Google AI Studio key — identity-preserving funny edit. */
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
    "Photo booth edit of THIS exact selfie.",
    "IDENTITY LOCK: Keep the identical real face — same person, skin tone, hair, eyes, nose, mouth, age, and likeness.",
    "Friends must instantly recognize this is THEM. Do NOT invent or morph a different face.",
    "ONLY change: clothing and background.",
    `Dress them in ${STYLE_COSTUME[style]} (${STYLE_LABEL[style]}).`,
    `Put them in front of: ${STYLE_BG[style]}.`,
    "Keep photorealistic face from the selfie. Square 1:1, face-centered. No text, watermark, or border.",
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
            {
              inline_data: {
                mime_type: mimeType,
                data: selfieBytes.toString("base64"),
              },
            },
            { text: prompt },
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

/** Free Pollinations Kontext img2img — last-resort; identity-first prompt. */
async function generateWithPollinations(
  selfieUrl: string,
  style: FunnyStyle
): Promise<Buffer> {
  const prompt = [
    "edit this exact photo of this exact person",
    "preserve identical face skin tone hair facial features likeness",
    "do not change the face",
    `only change clothes to ${STYLE_COSTUME[style]}`,
    `background ${STYLE_BG[style]}`,
    "same person funny photo booth",
    "no different person",
    "no watermark",
  ].join(", ");

  const params = new URLSearchParams({
    width: "1024",
    height: "1024",
    // Kontext is Pollinations' image-to-image model (better face lock)
    model: "kontext",
    image: selfieUrl,
    nologo: "true",
    // enhance rewrites the prompt and often destroys likeness
    enhance: "false",
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
 * Generate a funny image that still looks like the selfie person.
 */
export async function generateFunnyImage(
  input: GenerateInput
): Promise<GenerateResult> {
  const chosenStyle = input.style ?? pickRandomStyle();
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    "";

  // Cloudinary first (best free likeness — face pixels untouched).
  // Gemini optional. Pollinations Kontext last.
  const attempts: Array<{ name: string; run: () => Promise<Buffer> }> = [
    {
      name: "cloudinary",
      run: () => generateWithCloudinary(input.publicId, chosenStyle),
    },
  ];

  if (geminiKey) {
    attempts.push({
      name: "gemini",
      run: () => generateWithGemini(input.selfieUrl, chosenStyle, geminiKey),
    });
  }

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
