import type { SupportedLocale } from "@/i18n";

export const PROMPT_KEYS = [
  "daily_life",
  "farming_tip",
  "village",
  "food",
  "skill",
  "funny_story",
  "answer_question",
  "surprise_me",
] as const;

export type PromptKey = (typeof PROMPT_KEYS)[number];

interface PromptPack {
  hook: string;
  caption: string;
  recordingTip: string;
  cta: string;
  endCard: string;
}

const packs: Record<PromptKey, Record<SupportedLocale, PromptPack>> = {
  daily_life: {
    en: {
      hook: "A day in my life in Ethiopia 🇪🇹",
      caption:
        "Follow for more real moments from everyday Ethiopian life. #Ethiopia #DailyLife #AfricanLife",
      recordingTip:
        "Show what a typical moment in your day looks like — it could be breakfast, your commute, or something you do every day.",
      cta: "Follow for more",
      endCard: "Follow for more daily life videos",
    },
    am: {
      hook: "የዕለት ሕይወቴ 🇪🇹",
      caption:
        "ለተጨማሪ የኢትዮጵያ ዕለታዊ ሕይወት ቪዲዮዎች ይከተሉን። #ኢትዮጵያ #ዕለታዊሕይወት",
      recordingTip:
        "ከቀኑ አንድ ተፈጥሯዊ ጊዜ ያሳዩ — ቁርስ, ሥራ, ወይም ዕለታዊ ተግባር።",
      cta: "ይከተሉን",
      endCard: "ለተጨማሪ ቪዲዮዎች ይከተሉን",
    },
  },
  farming_tip: {
    en: {
      hook: "Ethiopian farmer's tip you need to know 🌾",
      caption:
        "Real farming knowledge from rural Ethiopia. Save this! #Ethiopia #Farming #Agriculture #AfricanFarmer",
      recordingTip:
        "Share one tip about farming, planting, harvesting, or caring for animals. Keep it simple and clear.",
      cta: "Save this tip",
      endCard: "More farming tips coming soon — Follow!",
    },
    am: {
      hook: "አርሶ አደር ምክር 🌾",
      caption:
        "ከኢትዮጵያ ያለ እውነተኛ የግብርና ዕውቀት። #ኢትዮጵያ #ግብርና #አርሶአደር",
      recordingTip:
        "ስለ ዘር, ምርት, ወይም ከብቶች አንድ ምክር ያካፍሉ። ቀላልና ግልጽ ያድርጉት።",
      cta: "ምክሩን አስቀምጡ",
      endCard: "ተጨማሪ ምክሮች ይከተሉን!",
    },
  },
  village: {
    en: {
      hook: "This is my village in Ethiopia 🏘️",
      caption:
        "Beautiful rural Ethiopia through my eyes. #Ethiopia #Village #RuralLife #AfricanVillage",
      recordingTip:
        "Walk outside and show your neighbourhood, your view, or something that makes your village special.",
      cta: "Explore more",
      endCard: "Follow for more from my village",
    },
    am: {
      hook: "ይህ የኔ መንደር ነው 🏘️",
      caption:
        "ዓይኖቼ ባዩት ቆንጆ ኢትዮጵያ። #ኢትዮጵያ #መንደር #ገጠር",
      recordingTip:
        "ወጥተው ሰፈርዎን, ምዕራፍዎን ወይም መንደርዎን ልዩ የሚያደርገውን ነገር ያሳዩ።",
      cta: "ተጨማሪ ይመልከቱ",
      endCard: "ከመንደሬ ለተጨማሪ ቪዲዮ ይከተሉን",
    },
  },
  food: {
    en: {
      hook: "This is what we eat in Ethiopia 🍲",
      caption:
        "Traditional Ethiopian food that will make you hungry! #Ethiopian Food #Injera #Ethiopia #AfricanFood",
      recordingTip:
        "Show a dish you cooked, a meal you're eating, or explain your favourite local food and how it's made.",
      cta: "Try this recipe",
      endCard: "More Ethiopian food — Follow!",
    },
    am: {
      hook: "በኢትዮጵያ የምንበላው ምግብ 🍲",
      caption:
        "የሚያጠግብ ባህላዊ የኢትዮጵያ ምግብ! #ኢትዮጵያምግብ #ኢንጀራ #ኢትዮጵያ",
      recordingTip:
        "ያቀናበሩትን ምግብ ያሳዩ ወይም ወዳጅዎን ምግብ ያስረዱ።",
      cta: "ምግቡን ሞክሩ",
      endCard: "ተጨማሪ የኢትዮጵያ ምግብ ይከተሉን!",
    },
  },
  skill: {
    en: {
      hook: "Watch what I can do 🙌",
      caption:
        "Skilled hands from Ethiopia. #Ethiopia #Craft #Skill #MadeInEthiopia",
      recordingTip:
        "Show your craft, trade, or skill in action. Let your hands do the talking.",
      cta: "Learn more",
      endCard: "Follow to see more skills",
    },
    am: {
      hook: "እኔ ምን ማድረግ እንደምችል ተመልከቱ 🙌",
      caption:
        "ከኢትዮጵያ የተካኑ እጆች። #ኢትዮጵያ #ክህሎት #ሙያ",
      recordingTip:
        "ሙያዎን ወይም ክህሎትዎን በተግባር ያሳዩ።",
      cta: "ተጨማሪ ይማሩ",
      endCard: "ተጨማሪ ክህሎቶችን ይከተሉን",
    },
  },
  funny_story: {
    en: {
      hook: "You won't believe what happened to me 😂",
      caption:
        "Funny moments from Ethiopian life. #Ethiopia #Funny #Comedy #AfricanHumor",
      recordingTip:
        "Tell a short funny story in a natural way. Start right at the funny part — don't take too long to set up.",
      cta: "Share if you laughed",
      endCard: "More laughs — Follow!",
    },
    am: {
      hook: "ምን እንደሆነ አታምኑም 😂",
      caption:
        "ከኢትዮጵያ ሕይወት አስቂኝ ጊዜዎች። #ኢትዮጵያ #አስቂኝ #ኮሜዲ",
      recordingTip:
        "አጭር አስቂኝ ታሪክ ያካፍሉ። ቀጥታ ወደ አስቂኙ ክፍል ይጀምሩ።",
      cta: "ካሳቀዎ ያጋሩ",
      endCard: "ተጨማሪ አስቂኝ ቪዲዮዎች ይከተሉን!",
    },
  },
  answer_question: {
    en: {
      hook: "People always ask me this question…",
      caption:
        "Answering your questions about life in Ethiopia. #Ethiopia #QandA #Facts #AfricanLife",
      recordingTip:
        "Answer one question you get asked a lot, or explain something about Ethiopian life or culture that people are curious about.",
      cta: "Ask me in comments",
      endCard: "More answers — Follow!",
    },
    am: {
      hook: "ሁሌ ይጠይቁኛል…",
      caption:
        "ስለ ኢትዮጵያ ሕይወት ጥያቄዎቻችሁን እመልሳለሁ። #ኢትዮጵያ #ጥያቄና መልስ",
      recordingTip:
        "ብዙ ጊዜ የሚጠየቁትን ጥያቄ ይመልሱ ወይም ሰዎችን ስለሚገርም ነገር ያስረዱ።",
      cta: "ጥያቄዎን ይጻፉ",
      endCard: "ተጨማሪ መልሶች ይከተሉን!",
    },
  },
  surprise_me: {
    en: {
      hook: "Something you've never seen before from Ethiopia 🌍",
      caption:
        "Real life from rural Ethiopia. #Ethiopia #Authentic #AfricanLife #Surprise",
      recordingTip:
        "Record anything real from your life — something you see, do, or feel today. Keep it genuine.",
      cta: "Follow for more",
      endCard: "Follow for more real Ethiopia",
    },
    am: {
      hook: "ከዚህ በፊት ያላዩት ነገር 🌍",
      caption:
        "ከኢትዮጵያ ገጠር እውነተኛ ሕይወት። #ኢትዮጵያ #እውነት #አፍሪካ",
      recordingTip:
        "ዛሬ ከሕይወትዎ ማንኛውንም እውነተኛ ነገር ቅረጹ — ያዩትን, የሚሠሩትን, ወይም የሚሰማዎትን።",
      cta: "ይከተሉን",
      endCard: "ለተጨማሪ ቪዲዮዎች ይከተሉን",
    },
  },
};

export function getPromptPack(key: PromptKey, locale: SupportedLocale): PromptPack {
  return packs[key][locale];
}

export function getAllPromptKeys(): PromptKey[] {
  return [...PROMPT_KEYS];
}
