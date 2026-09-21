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
    label: "ሽርሽራ አልባሳት",
    hook: "ይህ እርስዎ ነው — በሽርሽራ ልብስ! 🤡",
  },
  pixar_chaos: {
    label: "ካርቱን ልብስ",
    hook: "ፊትዎ ነው — ካርቱን ልብስ ለብሰዋል 🎬",
  },
  meme_legend: {
    label: "ሚም ልብስ",
    hook: "እርስዎ በሚም ልብስ ኢንተርኔትን ሰበሩ 💀",
  },
  superhero_fail: {
    label: "ጀግና ውድቀት",
    hook: "ጀግናው እርስዎ ነው — ኬፑ ግን ትንሽ ነው 🦸",
  },
  animal_mascot: {
    label: "ማስኮት",
    hook: "ፊትዎ ማስኮት ሆነ — አሁንም እርስዎ ነዎት 🦁",
  },
  yearbook_roast: {
    label: "የዓመት መጽሐፍ",
    hook: "የ1997 ፎቶዎ — ግን አሁንም እርስዎ ነዎት 📸",
  },
};

export function pickRandomStyle(): FunnyStyle {
  return STYLES[Math.floor(Math.random() * STYLES.length)];
}
