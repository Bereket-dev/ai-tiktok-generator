"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { locales, type SupportedLocale } from "@/i18n";
import { useSessionStore } from "@/store/session";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<SupportedLocale, { native: string; flag: string }> = {
  am: { native: "አማርኛ", flag: "🇪🇹" },
  en: { native: "English", flag: "🌍" },
};

export default function LanguagePicker() {
  const t = useTranslations("language");
  const router = useRouter();
  const pathname = usePathname();
  const { locale: currentLocale, setLocale } = useSessionStore();

  const handleSelect = (locale: SupportedLocale) => {
    setLocale(locale);
    // Replace locale segment in pathname
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/") || "/");
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
      <p className="text-earth-700 font-semibold text-lg text-center">
        {t("pick")}
      </p>
      <div className="grid grid-cols-2 gap-4 w-full">
        {locales.map((locale) => {
          const { native, flag } = LOCALE_LABELS[locale];
          const isActive = locale === currentLocale;
          return (
            <button
              key={locale}
              onClick={() => handleSelect(locale)}
              aria-pressed={isActive}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 text-center transition-all active:scale-95",
                "min-h-[120px] touch-manipulation",
                isActive
                  ? "border-orange-600 bg-orange-50 text-orange-700 shadow-md"
                  : "border-stone-200 bg-white text-stone-700 hover:border-orange-300 hover:bg-orange-50/50"
              )}
            >
              <span className="text-4xl">{flag}</span>
              <span className="font-bold text-lg leading-tight">{native}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
