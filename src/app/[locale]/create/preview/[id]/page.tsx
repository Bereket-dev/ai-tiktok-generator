"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSessionStore } from "@/store/session";
import { getPromptPack } from "@/lib/prompts";
import VideoPreview from "@/components/VideoPreview";
import EditorPanel from "@/components/EditorPanel";
import { Download, ExternalLink, Plus } from "lucide-react";
import type { SupportedLocale } from "@/i18n";
import type { PromptKey } from "@/lib/prompts";

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as SupportedLocale;
  const renderId = params.id as string;
  const t = useTranslations("preview");

  const { sessionId, selectedPromptKey } = useSessionStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["render", renderId],
    queryFn: async () => {
      const res = await fetch(
        `/api/renders/${renderId}?session_id=${encodeURIComponent(sessionId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch render");
      return res.json() as Promise<{ render: { output_url: string; status: string } }>;
    },
    enabled: !!renderId && !!sessionId,
    refetchInterval: (q) => {
      const status = q.state.data?.render?.status;
      return status === "ready" || status === "failed" ? false : 3000;
    },
  });

  const render = data?.render;
  const pack =
    selectedPromptKey
      ? getPromptPack(selectedPromptKey as PromptKey, locale)
      : null;

  const handleDownload = async () => {
    if (!render?.output_url) return;
    const a = document.createElement("a");
    a.href = render.output_url;
    a.download = `tiktok-creator-${renderId}.mp4`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenTikTok = () => {
    // Try TikTok app deep link first, fall back to upload web
    const tiktokUrl = "https://www.tiktok.com/upload";
    window.open(tiktokUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-orange-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl animate-spin">
            🎬
          </div>
          <p className="text-stone-600 font-medium">Loading your video…</p>
        </div>
      </div>
    );
  }

  if (isError || !render?.output_url) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-orange-50 px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <span className="text-5xl">😔</span>
          <p className="text-stone-700 font-semibold">Video not ready yet</p>
          <button
            onClick={() => router.back()}
            className="bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl active:scale-95"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-orange-50">
      {/* Mobile-first: video on top, actions below */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center gap-6 p-4 lg:p-8">
        {/* Video player (9:16) */}
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-black text-stone-900 text-center">
            {t("title")}
          </h1>
          <VideoPreview src={render.output_url} className="w-full max-w-sm" />
        </div>

        {/* Actions + caption panel */}
        <div className="flex flex-col gap-5 w-full max-w-sm mx-auto lg:mx-0 lg:pt-16">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-all touch-manipulation"
          >
            <Download className="w-6 h-6" />
            {t("download")}
          </button>

          {/* Open TikTok */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleOpenTikTok}
              className="w-full flex items-center justify-center gap-3 border-2 border-stone-900 text-stone-900 font-bold text-base py-4 rounded-2xl active:scale-95 transition-all touch-manipulation"
            >
              <ExternalLink className="w-5 h-5" />
              {t("openTikTok")}
            </button>
            <p className="text-stone-400 text-xs text-center px-2">
              {t("tiktokHint")}
            </p>
          </div>

          {/* Caption/hook */}
          {pack && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
              <EditorPanel hook={pack.hook} caption={pack.caption} />
            </div>
          )}

          {/* Make another */}
          <button
            onClick={() => router.push(`/${locale}/create`)}
            className="w-full flex items-center justify-center gap-2 border border-stone-200 text-stone-600 font-semibold py-4 rounded-2xl hover:bg-stone-50 active:scale-95 transition-all touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            {t("makeAnother")}
          </button>
        </div>
      </div>
    </main>
  );
}
