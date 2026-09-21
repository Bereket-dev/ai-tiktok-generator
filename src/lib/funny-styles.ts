/**
 * Client-safe funny style metadata (Amharic only).
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
    label: "ካሪካቸር",
    hook: "በጣም አስቂኝ ካሪካቸር ተሣልቷል ✏️",
  },
  pixar_chaos: {
    label: "ፒክሳር ቀልድ",
    hook: "የፒክሳር ፊልም ሰረቁ 🎬",
  },
  meme_legend: {
    label: "ሚም አፈ ታሪክ",
    hook: "ይህ ፊት ኢንተርኔትን ይሰብራል 💀",
  },
  superhero_fail: {
    label: "ጀግና ውድቀት",
    hook: "የጀግንነት ታሪክዎ ማሻሻያ ይፈልጋል 🦸",
  },
  animal_mascot: {
    label: "ማስኮት",
    hook: "ትምህርት ቤት መንፈስ በጣም አስቂኝ ነው 🦁",
  },
  yearbook_roast: {
    label: "የዓመት መጽሐፍ",
    hook: "የ1997 ክፍል ፎቶዎን ይፈልጋል 📸",
  },
};

export function pickRandomStyle(): FunnyStyle {
  return STYLES[Math.floor(Math.random() * STYLES.length)];
}
