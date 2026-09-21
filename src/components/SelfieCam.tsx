"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, RotateCcw, SwitchCamera, Zap } from "lucide-react";
import { useSessionStore } from "@/store/session";
import { cn } from "@/lib/utils";

type State = "loading" | "ready" | "countdown" | "captured" | "permission_error" | "banned";
type Facing = "user" | "environment";

export default function SelfieCam() {
  const router = useRouter();
  const { sessionId } = useSessionStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<State>("loading");
  const [facing, setFacing] = useState<Facing>("user");
  const [countdown, setCountdown] = useState(3);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startCamera = useCallback(async (mode: Facing = facing) => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setFacing(mode);
      setState("ready");
    } catch {
      setState("permission_error");
    }
  }, [facing]);

  useEffect(() => {
    startCamera("user");
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== "countdown") return;
    if (countdown <= 0) {
      snap();
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  });

  const flipCamera = async () => {
    const next: Facing = facing === "user" ? "environment" : "user";
    setState("loading");
    await startCamera(next);
  };

  const startCountdown = () => {
    setCountdown(3);
    setState("countdown");
  };

  const snap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // Mirror only for front camera
    if (facing === "user") {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      video,
      (video.videoWidth - size) / 2,
      0,
      size,
      size,
      0,
      0,
      size,
      size
    );
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setCapturedUrl(URL.createObjectURL(blob));
        setState("captured");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedBlob(null);
    setState("loading");
    startCamera(facing);
  };

  const submit = async () => {
    if (!capturedBlob || submitting) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("selfie", capturedBlob, "selfie.jpg");
      form.append("session_id", sessionId);
      const res = await fetch("/api/generate", { method: "POST", body: form });
      if (res.status === 403) {
        setState("banned");
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const { request_id } = await res.json();
      router.push(`/result/${request_id}`);
    } catch {
      setSubmitting(false);
      alert("Something went wrong. Please try again.");
    }
  };

  if (state === "banned") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white px-6 gap-4 text-center">
        <span className="text-6xl">🚫</span>
        <h2 className="text-xl font-bold">Access blocked</h2>
        <p className="text-stone-400 text-sm max-w-xs">
          This device can&apos;t use the booth right now.
        </p>
      </div>
    );
  }

  if (state === "permission_error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white px-6 gap-6 text-center">
        <span className="text-6xl">📷</span>
        <h2 className="text-xl font-bold">Camera access required</h2>
        <p className="text-stone-400 text-sm max-w-xs">
          Allow camera access in your browser settings, then try again.
        </p>
        <button
          onClick={() => startCamera(facing)}
          className="bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isFront = facing === "user";

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {state !== "captured" && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: isFront ? "scaleX(-1)" : undefined }}
        />
      )}

      {state === "captured" && capturedUrl && (
        <img
          src={capturedUrl}
          alt="Captured"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Flip camera */}
      {(state === "ready" || state === "countdown") && (
        <button
          onClick={flipCamera}
          className="absolute top-6 right-4 z-20 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 touch-manipulation"
          aria-label="Flip camera"
        >
          <SwitchCamera className="w-6 h-6" />
        </button>
      )}

      <div className="absolute top-8 left-4 right-16 z-10 text-center">
        <p className="text-white font-black text-2xl drop-shadow-lg leading-tight">
          {state === "captured" ? "Looking good!" : "Strike a pose"}
        </p>
        <p className="text-orange-300 text-sm mt-1 font-medium">
          {state === "captured"
            ? "Tap below for your funny AI look"
            : isFront
              ? "Front camera · flip for back"
              : "Back camera · flip for selfie"}
        </p>
      </div>

      {(state === "ready" || state === "countdown") && (
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] z-10",
            "w-64 h-64 rounded-full border-4 border-dashed",
            state === "countdown" ? "border-orange-400 animate-pulse" : "border-white/50"
          )}
        />
      )}

      {state === "countdown" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <span className="text-white text-[140px] font-black drop-shadow-2xl leading-none animate-bounce">
            {countdown}
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20 pb-10 px-6 flex flex-col items-center gap-4">
        {state === "ready" && (
          <>
            <p className="text-white/70 text-sm text-center">Center your face, then snap</p>
            <button
              onClick={startCountdown}
              className="w-24 h-24 rounded-full bg-white border-4 border-orange-500 flex items-center justify-center shadow-2xl active:scale-95 transition-transform touch-manipulation"
              aria-label="Take photo"
            >
              <Camera className="w-10 h-10 text-orange-600" />
            </button>
          </>
        )}

        {state === "loading" && (
          <div className="w-8 h-8 rounded-full border-4 border-white border-t-transparent animate-spin" />
        )}

        {state === "captured" && (
          <div className="w-full flex flex-col gap-3 max-w-xs">
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 bg-orange-600 text-white font-black text-xl py-5 rounded-2xl shadow-2xl active:scale-95 transition-all disabled:opacity-70 touch-manipulation"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  AI is roasting you…
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" fill="white" />
                  Make It Funny!
                </>
              )}
            </button>
            <button
              onClick={retake}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 border border-white/40 text-white font-semibold py-4 rounded-2xl active:scale-95 transition-all touch-manipulation"
            >
              <RotateCcw className="w-5 h-5" /> Retake
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
