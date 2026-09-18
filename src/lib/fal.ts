/**
 * Funny image generation using Cloudinary's free built-in AI transformations.
 * No external AI API required — all effects are applied via Cloudinary URL params.
 *
 * Free tier: 25 credits/month. Each transformation costs ~1 credit.
 * https://cloudinary.com/documentation/transformation_reference
 */

export type FunnyStyle =
  | "cartoon"
  | "pop_art"
  | "oil_painting"
  | "neon_glow"
  | "sketch"
  | "vaporwave";

const STYLES: FunnyStyle[] = [
  "cartoon",
  "pop_art",
  "oil_painting",
  "neon_glow",
  "sketch",
  "vaporwave",
];

export const STYLE_META: Record<FunnyStyle, { label: string; labelAm: string; hook: string; hookAm: string }> = {
  cartoon: {
    label: "Cartoon You",
    labelAm: "የካርቱን እርስዎ",
    hook: "Your cartoon self just went viral 🎨",
    hookAm: "የካርቱን ምስልዎ ቫይራል ሆኗል 🎨",
  },
  pop_art: {
    label: "Pop Art Star",
    labelAm: "ፖፕ አርት ኮከብ",
    hook: "Andy Warhol would be jealous 🎯",
    hookAm: "አንዲ ዋርሆል ቀናተኛ ይሆን ነበር 🎯",
  },
  oil_painting: {
    label: "Renaissance You",
    labelAm: "ሬኔሳንስ እርስዎ",
    hook: "Masters painted you 500 years ago 🖼️",
    hookAm: "ሰዓሊዎቹ ከ500 ዓመት በፊት ቀርጸዋዎት ነበር 🖼️",
  },
  neon_glow: {
    label: "Neon Glow",
    labelAm: "ኒዮን ብርሃን",
    hook: "You just stepped out of a music video ✨",
    hookAm: "ከሙዚቃ ቪዲዮ ወጡ ✨",
  },
  sketch: {
    label: "Pencil Sketch",
    labelAm: "እርሳስ ሥዕል",
    hook: "Someone sketched you in their notebook 📝",
    hookAm: "ማንም ሰው ደብተሩ ላይ ሣለዎ 📝",
  },
  vaporwave: {
    label: "Vaporwave",
    labelAm: "ቫፐርዌቭ",
    hook: "You belong in 1984's future 🌆",
    hookAm: "በ1984 የወደፊት ጊዜ ይኖራሉ 🌆",
  },
};

/** Pick a random style */
export function pickRandomStyle(): FunnyStyle {
  return STYLES[Math.floor(Math.random() * STYLES.length)];
}

/**
 * Build a Cloudinary transformation URL that applies the funny style.
 * Takes the uploaded selfie public_id and returns a styled URL — no extra API call.
 */
export function buildFunnyImageUrl(publicId: string, style: FunnyStyle): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Each transformation chain is applied left-to-right
  const transforms: Record<FunnyStyle, string> = {
    cartoon:
      // Cartoonify + boost saturation + sharpen
      "e_cartoonify:60:100/e_saturation:50/e_sharpen:80",

    pop_art:
      // Pixelate slightly, hard posterize to 3 levels, boost contrast + saturation = pop art look
      "e_ordered_dither:9/e_contrast:70/e_saturation:100/e_vibrance:80",

    oil_painting:
      // Blur edges (simulate brush strokes) + boost warmth
      "e_oil_paint:30/e_saturation:30/e_contrast:20",

    neon_glow:
      // Grayscale + invert + high contrast + blue/purple colorize = neon on black
      "e_grayscale/e_contrast:80/e_brightness:-20/e_colorize:50,co_rgb:8800ff",

    sketch:
      // Grayscale + very high contrast + sharpen hard = pencil sketch
      "e_grayscale/e_contrast:100/e_sharpen:200/e_brightness:20",

    vaporwave:
      // Hue rotate to pink/teal palette + boost contrast
      "e_hue:160/e_saturation:80/e_contrast:30/e_brightness:-10",
  };

  // Always square-crop around the face, then apply effect, then add text overlay
  const faceTransform = "g_face,c_fill,w_1000,h_1000,r_max";
  const effectTransform = transforms[style];

  return `${base}/${faceTransform}/${effectTransform}/${publicId}`;
}

export interface GenerateResult {
  imageUrl: string;
  style: FunnyStyle;
}

/**
 * "Generate" a funny image — purely via Cloudinary URL transformation.
 * Instant, free, no external API.
 */
export function generateFunnyImage(publicId: string, style?: FunnyStyle): GenerateResult {
  const chosenStyle = style ?? pickRandomStyle();
  const imageUrl = buildFunnyImageUrl(publicId, chosenStyle);
  return { imageUrl, style: chosenStyle };
}
