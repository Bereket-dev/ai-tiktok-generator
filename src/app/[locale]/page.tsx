import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import LanguagePicker from "@/components/LanguagePicker";

interface WelcomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: WelcomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}

export default async function WelcomePage({ params }: WelcomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "welcome" });

  const steps = [
    { icon: "💡", label: t("step1") },
    { icon: "🎥", label: t("step2") },
    { icon: "✨", label: t("step3") },
    { icon: "📲", label: t("step4") },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-orange-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-2xl font-black tracking-tight text-orange-700">
          🎬 Creator
        </span>
        <LanguagePicker />
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-6">
        <div className="flex flex-col items-center gap-4 max-w-xs">
          <div className="w-20 h-20 rounded-full bg-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-4xl">🎬</span>
          </div>

          <h1 className="text-3xl font-black text-stone-900 leading-tight">
            {t("headline")}
          </h1>

          <p className="text-stone-600 text-base leading-relaxed">
            {t("promise")}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/${locale}/snap`}
          className="w-full max-w-xs bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xl py-5 rounded-2xl text-center transition-all shadow-lg touch-manipulation"
        >
          {t("start")}
        </Link>

        <p className="text-stone-400 text-sm px-4">{t("privacy")}</p>
      </div>

      {/* How it works */}
      <div className="bg-white/70 backdrop-blur-sm px-6 py-8 border-t border-stone-100">
        <h2 className="text-center text-stone-500 text-sm font-semibold uppercase tracking-widest mb-6">
          {t("howItWorks")}
        </h2>
        <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                {step.icon}
              </div>
              <span className="text-stone-600 text-xs font-medium leading-snug">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
