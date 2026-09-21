/**
 * Client-safe funny style metadata (Amharic only).
 * Comedy = YOU in a silly costume (same face, absurd outfit/scene).
 */

export type FunnyStyle =
  | "caricature"
  | "pixar_chaos"
  | "meme_legend"
  | "superhero_fail"
  | "animal_mascot"
  | "yearbook_roast";

export const STYLES: FunnyStyle[] = [
  "caricature",
  "pixar_chaos",
  "meme_legend",
  "superhero_fail",
  "animal_mascot",
  "yearbook_roast",
];

export const STYLE_META: Record<
  FunnyStyle,
  { label: string; hook: string }
> = {
  caricature: {
    label: "ልብሶን ከመቼው ቀየሩ",
    hook: "እንዴት ነው ሚያምረው ልብሶ! 🤡",
  },
  pixar_chaos: {
    label: "ካርቱን ልብስ",
    hook: "ፊትዎ ነው — ካርቱን ልብስ ለብሰዋል 🎬",
  },
  meme_legend: {
    label: "ሜም ልብስ",
    hook: "እርስዎ በሜም ልብስ ኢንተርኔትን ሰበሩ 💀",
  },
  superhero_fail: {
    label: "ጀግና ውድቀት",
    hook: "ጀግናው እርስዎ ነው — ኬፑ ግን ትንሽ ነው 🦸",
  },
  animal_mascot: {
    label: "ማስክ",
    hook: "ፊትዎ ላይ ማስክ ሆነ — አሁንም እርስዎ ነዎት 🦁",
  },
  yearbook_roast: {
    label: "የዓመት ገፅ",
    hook: "የ1997 ፎቶዎ — ግን አሁንም እርስዎ ነዎት 📸",
  },
};

export function pickRandomStyle(): FunnyStyle {
  return STYLES[Math.floor(Math.random() * STYLES.length)];
}
