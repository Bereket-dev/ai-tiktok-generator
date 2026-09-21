/**
 * Client-safe funny style metadata (no Node / Cloudinary imports).
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
  { label: string; labelAm: string; hook: string; hookAm: string }
> = {
  caricature: {
    label: "Caricature Roast",
    labelAm: "ካሪካቸር",
    hook: "Someone drew you mean… and hilarious ✏️",
    hookAm: "በጣም አስቂኝ ካሪካቸር ተሣልቷል ✏️",
  },
  pixar_chaos: {
    label: "Pixar Chaos",
    labelAm: "ፒክሳር ቀልድ",
    hook: "You just stole a Pixar short film 🎬",
    hookAm: "የፒክሳር ፊልም ሰረቁ 🎬",
  },
  meme_legend: {
    label: "Meme Legend",
    labelAm: "ሚም አፈ ታሪክ",
    hook: "This face is about to break the internet 💀",
    hookAm: "ይህ ፊት ኢንተርኔትን ይሰብራል 💀",
  },
  superhero_fail: {
    label: "Hero Fail",
    labelAm: "ጀግና ውድቀት",
    hook: "Your origin story needs work 🦸",
    hookAm: "የጀግንነት ታሪክዎ ማሻሻያ ይፈልጋል 🦸",
  },
  animal_mascot: {
    label: "Mascot Mode",
    labelAm: "ማስኮት",
    hook: "School spirit never looked this silly 🦁",
    hookAm: "ትምህርት ቤት መንፈስ በጣም አስቂኝ ነው 🦁",
  },
  yearbook_roast: {
    label: "Yearbook Roast",
    labelAm: "የዓመት መጽሐፍ",
    hook: "Class of '97 called… they want their photo back 📸",
    hookAm: "የ1997 ክፍል ፎቶዎን ይፈልጋል 📸",
  },
};

export function pickRandomStyle(): FunnyStyle {
  return STYLES[Math.floor(Math.random() * STYLES.length)];
}
