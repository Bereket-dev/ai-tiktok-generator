"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROMPT_KEYS, type PromptKey } from "@/lib/prompts";
import { useSessionStore } from "@/store/session";
import { cn } from "@/lib/utils";

const IDEA_ICONS: Record<PromptKey, string> = {
  daily_life: "☀️",
  farming_tip: "🌾",
  village: "🏘️",
  food: "🍲",
  skill: "🙌",
  funny_story: "😂",
  answer_question: "💬",
  surprise_me: "🎲",
};

interface IdeaGridProps {
  locale: string;
}

export default function IdeaGrid({ locale }: IdeaGridProps) {
  const t = useTranslations("ideas");
  const router = useRouter();
  const { setSelectedPromptKey } = useSessionStore();
  const [selected, setSelected] = useState<PromptKey | null>(null);
  const [showHint, setShowHint] = useState<PromptKey | null>(null);

  const handleSelect = (key: PromptKey) => {
    if (selected === key) {
      // Second tap = confirm
      setSelectedPromptKey(key);
      router.push(`/${locale}/create/record`);
    } else {
      setSelected(key);
      setShowHint(key);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto px-4">
      {PROMPT_KEYS.map((key) => {
        const isSelected = selected === key;
        return (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            aria-pressed={isSelected}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center",
              "min-h-[120px] transition-all active:scale-95 touch-manipulation",
              isSelected
                ? "border-orange-600 bg-orange-50 shadow-md"
                : "border-stone-200 bg-white hover:border-orange-300"
            )}
          >
            <span className="text-4xl">{IDEA_ICONS[key]}</span>
            <span
              className={cn(
                "font-bold text-sm leading-tight",
                isSelected ? "text-orange-700" : "text-stone-800"
              )}
            >
              {t(`${key}.label`)}
            </span>
            {isSelected && (
              <span className="text-xs text-orange-600 font-medium mt-1">
                Tap again ✓
              </span>
            )}
          </button>
        );
      })}

      {/* Hint panel */}
      {showHint && (
        <div className="col-span-2 bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-orange-800 text-sm font-medium">
            💡 {t(`${showHint}.hint`)}
          </p>
          <p className="text-orange-600 text-xs mt-1">
            {locale === "am" ? "ለመቀጠል እንደገና ይጫኑ →" : "Tap the card again to continue →"}
          </p>
        </div>
      )}
    </div>
  );
}
