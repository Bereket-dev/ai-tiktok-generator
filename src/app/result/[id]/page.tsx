"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSessionStore } from "@/store/session";
import { useEffect, useState } from "react";
import { Lock, Zap, CheckCircle } from "lucide-react";
import { STYLE_META, type FunnyStyle } from "@/lib/fal";
import { cn } from "@/lib/utils";

const DEFAULT_HOOK = "Your AI transformation is ready 🤩";

export default function ResultPage() {
  const params = useParams();
  const requestId = params.id as string;
  const { sessionId } = useSessionStore();
  const [requested, setRequested] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["result", requestId],
    queryFn: async () => {
      const res = await fetch(
        `/api/result/${requestId}?session_id=${encodeURIComponent(sessionId)}`
      );
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
      if (s === "failed" || q.state.data?.unlocked) return false;
      return 1500;
    },
  });

  // Auto-request unlock once ready so admin sees it without an extra tap
  useEffect(() => {
    if (!data || requestSent || requested) return;
    if (data.unlocked) return;
    if (data.status === "ready" || data.status === "unlock_requested") {
      setRequested(true);
      fetch(`/api/result/${requestId}/request-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then(() => setRequestSent(true))
        .catch(() => setRequested(false));
    }
  }, [data, requestId, sessionId, requestSent, requested]);

  const hook =
    data?.style && data.style in STYLE_META
      ? STYLE_META[data.style as FunnyStyle].hook
      : DEFAULT_HOOK;

  if (isLoading || !data || data.status === "processing" || data.status === "pending") {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 px-6">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 animate-spin border-t-orange-500" />
          <div
            className="absolute inset-3 rounded-full border-4 border-orange-400/20 animate-spin border-t-orange-400"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🤖</div>
        </div>
        <div className="text-center">
          <h1 className="text-white font-black text-2xl">Cooking your look…</h1>
          <p className="text-orange-300 text-sm mt-2 animate-pulse">Almost there</p>
        </div>
      </div>
    );
  }

  if (data.status === "failed" || data.status === "rejected") {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-6xl">{data.status === "rejected" ? "🚫" : "😬"}</span>
        <h1 className="text-white font-bold text-xl">
          {data.status === "rejected" ? "Not approved this time" : "Something went wrong"}
        </h1>
        <Link href="/" className="bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl">
          Try Again
        </Link>
      </div>
    );
  }

  if (data.unlocked && data.result_url) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <p className="text-orange-400 font-black text-lg uppercase tracking-widest">Unlocked</p>
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
            Download Image
          </a>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 border border-white/20 text-white font-semibold py-4 rounded-2xl"
          >
            Make Another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center px-4">
        <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-2">
          Funny image ready!
        </p>
        <h1 className="text-white font-black text-2xl leading-tight">{hook}</h1>
        <p className="text-stone-400 text-sm mt-2">Waiting for host to unlock</p>
      </div>

      <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl ring-2 ring-orange-500/50">
        <div className="w-full h-full bg-gradient-to-br from-orange-900/60 via-purple-900/60 to-stone-900 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-xl bg-stone-900/40" />
          <span className="text-8xl opacity-30 select-none">🤩</span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center ring-2 ring-orange-500">
            <Lock className="w-9 h-9 text-orange-400" />
          </div>
          <p className="text-white font-bold text-base drop-shadow-lg">Locked until approved</p>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {requestSent ? (
          <div
            className={cn(
              "w-full flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-5 rounded-2xl"
            )}
          >
            <CheckCircle className="w-6 h-6" />
            Sent to host — hang tight
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-3 bg-orange-600 text-white font-black text-lg py-5 rounded-2xl">
            <Zap className="w-6 h-6" fill="white" />
            Requesting unlock…
          </div>
        )}
      </div>
    </div>
  );
}
