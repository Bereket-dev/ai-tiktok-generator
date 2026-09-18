"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSessionStore } from "@/store/session";
import { useState } from "react";
import { Lock, Zap, CheckCircle } from "lucide-react";
import type { SupportedLocale } from "@/i18n";
import { cn } from "@/lib/utils";

const STYLE_HOOKS: Record<string, { em: string; am: string }> = {
  anime_villain:     { em: "You're the villain we never knew we needed 😈", am: "እርስዎ ያልታሰበ ተቃዋሚ ነዎት 😈" },
  royal_portrait:    { em: "Royalty was always in your blood 👑",            am: "ክቡርነት ሁልጊዜ በደምዎ ውስጥ ነበር 👑" },
  action_hero:       { em: "Hollywood called. You're the lead 🎬",           am: "ሆሊዉድ ደወለ። እርስዎ ዋናው ናቸው 🎬" },
  cartoon:           { em: "Your cartoon self just went viral 🎨",           am: "የካርቱን ምስልዎ ቫይራል ሆኗል 🎨" },
  renaissance_painting: { em: "Masters painted you 500 years ago 🖼️",       am: "ሰዓሊዎቹ ከ500 ዓመት በፊት ቀርጸዋዎት ነበር 🖼️" },
  pop_art:           { em: "Andy Warhol would be jealous 🎯",                am: "አንዲ ዋርሆል ቀናተኛ ይሆን ነበር 🎯" },
};

const DEFAULT_HOOK = { em: "Your AI transformation is ready 🤩", am: "የ AI ለውጥዎ ዝግጁ ነው 🤩" };

export default function ResultPage() {
  const params = useParams();
  const locale = params.locale as SupportedLocale;
  const requestId = params.id as string;
  const t = useTranslations("result");
  const { sessionId } = useSessionStore();
  const [requested, setRequested] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["result", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/result/${requestId}?session_id=${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        id: string;
        status: string;
        style: string | null;
        unlocked: boolean;
        result_url: string | null;
      }>;
    },
    enabled: !!requestId && !!sessionId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "ready" || s === "failed" || q.state.data?.unlocked ? false : 3000;
    },
  });

  const hook = data?.style
    ? (STYLE_HOOKS[data.style]?.[locale === "am" ? "am" : "em"] ?? DEFAULT_HOOK[locale === "am" ? "am" : "em"])
    : DEFAULT_HOOK[locale === "am" ? "am" : "em"];

  const handleRequestUnlock = async () => {
    setRequested(true);
    // POST to mark the request as unlock-requested
    await fetch(`/api/result/${requestId}/request-unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(() => {});
    setRequestSent(true);
  };

  // ── Processing state ──────────────────────────────────────
  if (isLoading || !data || data.status === "processing" || data.status === "pending") {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 px-6">
        <div className="relative w-32 h-32">
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 animate-spin border-t-orange-500" />
          <div className="absolute inset-3 rounded-full border-4 border-orange-400/20 animate-spin border-t-orange-400" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🤖</div>
        </div>
        <div className="text-center">
          <h1 className="text-white font-black text-2xl">{t("processingTitle")}</h1>
          <p className="text-orange-300 text-sm mt-2 animate-pulse">{t("processingSubtitle")}</p>
        </div>
        {/* Fun loading messages */}
        <ProcessingMessages locale={locale} />
      </div>
    );
  }

  // ── Failed state ───────────────────────────────────────────
  if (data.status === "failed") {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-6xl">😬</span>
        <h1 className="text-white font-bold text-xl">{t("failedTitle")}</h1>
        <a href={`/${locale}/snap`} className="bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl">
          {t("tryAgain")}
        </a>
      </div>
    );
  }

  // ── Unlocked — show full image ─────────────────────────────
  if (data.unlocked && data.result_url) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <p className="text-orange-400 font-black text-lg uppercase tracking-widest">{t("unlockedBadge")}</p>
          <h1 className="text-white font-black text-3xl mt-1">{hook}</h1>
        </div>
        <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl ring-4 ring-orange-500">
          <img src={data.result_url} alt="Your AI image" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <a
            href={data.result_url}
            download="my-ai-image.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-4 rounded-2xl"
          >
            ⬇️ {t("download")}
          </a>
          <a
            href={`/${locale}/snap`}
            className="w-full flex items-center justify-center gap-2 border border-white/20 text-white font-semibold py-4 rounded-2xl"
          >
            🤩 {t("makeAnother")}
          </a>
        </div>
      </div>
    );
  }

  // ── Ready but locked — blurred teaser ─────────────────────
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 px-4">
      {/* Hook text */}
      <div className="text-center px-4">
        <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-2">{t("readyBadge")}</p>
        <h1 className="text-white font-black text-2xl leading-tight">{hook}</h1>
        <p className="text-stone-400 text-sm mt-2">{t("lockedSubtitle")}</p>
      </div>

      {/* Blurred image teaser */}
      <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl ring-2 ring-orange-500/50">
        {/* We show a blurred placeholder — actual image stays server-side until unlocked */}
        <div className="w-full h-full bg-gradient-to-br from-orange-900/60 via-purple-900/60 to-stone-900 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-xl bg-stone-900/40" />
          {/* Silhouette hint */}
          <span className="text-8xl opacity-30 select-none">🤩</span>
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center ring-2 ring-orange-500">
            <Lock className="w-9 h-9 text-orange-400" />
          </div>
          <p className="text-white font-bold text-base drop-shadow-lg">{t("lockedLabel")}</p>
        </div>
      </div>

      {/* Request unlock CTA */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {requestSent ? (
          <div className={cn(
            "w-full flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-5 rounded-2xl"
          )}>
            <CheckCircle className="w-6 h-6" />
            {t("requestSent")}
          </div>
        ) : (
          <button
            onClick={handleRequestUnlock}
            disabled={requested}
            className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg py-5 rounded-2xl shadow-lg shadow-orange-900/50 active:scale-95 transition-all disabled:opacity-70 touch-manipulation"
          >
            <Zap className="w-6 h-6" fill="white" />
            {t("requestUnlock")}
          </button>
        )}
        <p className="text-stone-500 text-xs text-center px-4">{t("requestHint")}</p>
      </div>
    </div>
  );
}

// Cycling funny messages while AI generates
function ProcessingMessages({ locale }: { locale: string }) {
  const messages = locale === "am"
    ? ["ፊትዎን እያነበብን ነው… 🔍", "ጥበብ እየፈጠርን ነው… 🎨", "ድንቅ ውጤት ይጠብቁ… ✨", "AI ሠርቷል! 🤖"]
    : ["Reading your face… 🔍", "Summoning the AI… 🎨", "Making you iconic… ✨", "Almost ready! 🤖"];

  const [idx, setIdx] = useState(0);
  useState(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % messages.length), 1800);
    return () => clearInterval(id);
  });

  return (
    <p key={idx} className="text-stone-400 text-sm animate-pulse text-center">
      {messages[idx]}
    </p>
  );
}
