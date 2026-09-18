"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  FlipHorizontal,
  RotateCcw,
  CheckCircle,
  StopCircle,
  Video,
} from "lucide-react";
import { buildRecorderOptions, mimeToExtension } from "@/lib/media";
import { useSessionStore } from "@/store/session";
import { saveDraft } from "@/lib/draft";
import { cn } from "@/lib/utils";

type RecordingState = "idle" | "countdown" | "recording" | "preview" | "permission_error";
type TimerMode = 15 | 30;

interface CameraRecorderProps {
  locale: string;
  promptKey: string;
  promptHint: string;
}

const COUNTDOWN_SECONDS = 3;

export default function CameraRecorder({
  locale,
  promptKey,
  promptHint,
}: CameraRecorderProps) {
  const t = useTranslations("record");
  const router = useRouter();
  const { setProjectId } = useSessionStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [state, setState] = useState<RecordingState>("idle");
  const [timerMode, setTimerMode] = useState<TimerMode>(15);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (facing: "user" | "environment" = facingMode) => {
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9 / 16 },
          },
          audio: micEnabled,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setState("idle");
      } catch (err) {
        console.error("Camera error:", err);
        setState("permission_error");
      }
    },
    [facingMode, micEnabled, stopStream]
  );

  useEffect(() => {
    startCamera();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    if (state !== "countdown") return;
    if (countdown <= 0) {
      beginRecording();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  });

  // Elapsed timer during recording
  useEffect(() => {
    if (state !== "recording") return;
    if (elapsed >= timerMode) {
      stopRecording();
      return;
    }
    const t = setTimeout(() => setElapsed((e) => e + 1), 1000);
    return () => clearTimeout(t);
  });

  const beginRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const opts = buildRecorderOptions();
    const recorder = new MediaRecorder(streamRef.current, opts);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setState("preview");
      if (previewRef.current) {
        previewRef.current.src = url;
      }
    };

    recorder.start(500); // collect in 500ms chunks
    setElapsed(0);
    setState("recording");
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const handleStartCountdown = () => {
    setCountdown(COUNTDOWN_SECONDS);
    setState("countdown");
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedBlob(null);
    setElapsed(0);
    setState("idle");
    startCamera();
  };

  const handleFlip = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  const handleContinue = async () => {
    if (!recordedBlob) return;
    // Save to IndexedDB as draft
    const ext = mimeToExtension(recordedBlob.type);
    const draftKey = `draft_${promptKey}_${Date.now()}`;
    await saveDraft(draftKey, recordedBlob);
    // Store draft key in session and proceed to processing (project created via API)
    router.push(`/${locale}/create/processing/new?draft=${draftKey}&prompt=${promptKey}`);
  };

  const timeRemaining = timerMode - elapsed;
  const progressPct = (elapsed / timerMode) * 100;

  if (state === "permission_error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white px-6 gap-6 text-center">
        <CameraOff className="w-16 h-16 text-red-400" />
        <h2 className="text-xl font-bold">{t("permissionDenied")}</h2>
        <p className="text-stone-400 text-sm leading-relaxed max-w-xs">
          {t("permissionHelp")}
        </p>
        <button
          onClick={() => startCamera()}
          className="bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl active:scale-95"
        >
          {t("retake")}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-screen bg-black overflow-hidden">
      {/* Camera feed (hidden during preview) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          state === "preview" ? "hidden" : "block"
        )}
        style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
      />

      {/* Recorded preview */}
      {state === "preview" && (
        <video
          ref={previewRef}
          controls
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "none" }}
        />
      )}

      {/* Dark overlay for idle/countdown */}
      {(state === "idle" || state === "countdown") && (
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe-top pt-4">
        {/* Timer mode selector */}
        {state === "idle" && (
          <div className="flex gap-1 bg-black/40 backdrop-blur-sm rounded-full p-1">
            {([15, 30] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setTimerMode(m)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-bold transition-colors touch-manipulation",
                  timerMode === m
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white"
                )}
              >
                {m === 15 ? t("timer15") : t("timer30")}
              </button>
            ))}
          </div>
        )}
        {state !== "idle" && <div />}

        {/* Mic toggle */}
        <button
          onClick={() => setMicEnabled((m) => !m)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white touch-manipulation"
          aria-label={micEnabled ? t("micOn") : t("micOff")}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
        </button>
      </div>

      {/* Prompt hint */}
      {state === "idle" && (
        <div className="absolute top-20 left-4 right-4 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3">
            <p className="text-white/90 text-sm leading-snug">
              <span className="font-semibold text-orange-300">{t("instructionPrefix")}</span>{" "}
              {promptHint}
            </p>
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      {state === "countdown" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="text-white text-9xl font-black drop-shadow-2xl animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {/* Recording progress bar */}
      {state === "recording" && (
        <>
          <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/20">
            <div
              className="h-full bg-red-500 transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-600 rounded-full px-4 py-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white font-bold text-sm">{timeRemaining}s</span>
          </div>
        </>
      )}

      {/* Side controls (flip) */}
      {(state === "idle" || state === "recording") && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
          {state === "idle" && (
            <button
              onClick={handleFlip}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white touch-manipulation"
              aria-label={t("flip")}
            >
              <FlipHorizontal className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe-bottom pb-8 px-6">
        {state === "idle" && (
          <div className="flex items-center justify-center">
            <button
              onClick={handleStartCountdown}
              className="w-20 h-20 rounded-full bg-red-600 border-4 border-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform touch-manipulation"
              aria-label={t("start")}
            >
              <Video className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        {state === "recording" && (
          <div className="flex items-center justify-center">
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-white border-4 border-red-600 flex items-center justify-center shadow-2xl active:scale-95 transition-transform touch-manipulation"
              aria-label={t("stop")}
            >
              <StopCircle className="w-10 h-10 text-red-600" />
            </button>
          </div>
        )}

        {state === "preview" && (
          <div className="flex gap-4 items-center justify-center">
            <button
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 bg-black/60 backdrop-blur-sm text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform touch-manipulation"
            >
              <RotateCcw className="w-5 h-5" />
              {t("retake")}
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform shadow-lg touch-manipulation"
            >
              <CheckCircle className="w-5 h-5" />
              {t("continue")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
