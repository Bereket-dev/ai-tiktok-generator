import { getTranslations } from "next-intl/server";
import IdeaGrid from "@/components/IdeaGrid";
import Link from "next/link";

interface CreatePageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreatePage({ params }: CreatePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ideas" });

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-orange-50 flex flex-col">
      {/* Nav */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-white/70 backdrop-blur-sm">
        <Link
          href={`/${locale}`}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors touch-manipulation"
          aria-label="Back"
        >
          ←
        </Link>
        <span className="font-black text-orange-700 text-lg">🎬 Creator</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center gap-6 py-8">
        <div className="text-center px-6">
          <h1 className="text-2xl font-black text-stone-900">{t("title")}</h1>
          <p className="text-stone-500 text-sm mt-1">{t("subtitle")}</p>
        </div>

        <IdeaGrid locale={locale} />
      </div>
    </main>
  );
}
