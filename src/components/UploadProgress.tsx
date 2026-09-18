"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session";
import { getDraft, deleteDraft } from "@/lib/draft";
import { Progress } from "@/components/ui/progress";

type Phase = "uploading" | "rendering" | "done" | "failed";

interface UploadProgressProps {
  locale: string;
  draftKey: string;
  promptKey: string;
}

export default function UploadProgress({
  locale,
  draftKey,
  promptKey,
}: UploadProgressProps) {
  const t = useTranslations("processing");
  const router = useRouter();
  const { sessionId, setProjectId, setRenderId } = useSessionStore();

  const [phase, setPhase] = useState<Phase>("uploading");
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [renderId, setLocalRenderId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startFlow();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startFlow() {
    try {
      // 1. Create project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_key: promptKey,
          locale,
          session_id: sessionId,
          source_rights_confirmed: true,
        }),
      });
      if (!projectRes.ok) throw new Error("Failed to create project");
      const { project } = await projectRes.json();
      setProjectId(project.id);

      // 2. Upload from IndexedDB draft
      const blob = await getDraft(draftKey);
      if (!blob) throw new Error("Draft not found");

      const formData = new FormData();
      formData.append("file", blob, `recording.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
      formData.append("project_id", project.id);
      formData.append("session_id", sessionId);

      // Simulate upload progress with XHR for actual % reporting
      await uploadWithProgress(formData, (pct) => setUploadPct(pct));

      // Delete draft after successful upload
      await deleteDraft(draftKey);

      // 3. Enqueue render
      setPhase("rendering");
      const renderRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id, session_id: sessionId }),
      });
      if (!renderRes.ok) throw new Error("Failed to queue render");
      const { render } = await renderRes.json();
      setLocalRenderId(render.id);
      setRenderId(render.id);

      // 4. Poll render status
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/renders/${render.id}?session_id=${encodeURIComponent(sessionId)}`
          );
          if (!statusRes.ok) return;
          const { render: r } = await statusRes.json();
          if (r.status === "ready") {
            clearInterval(pollRef.current!);
            setPhase("done");
            router.push(`/${locale}/create/preview/${render.id}`);
          } else if (r.status === "failed") {
            clearInterval(pollRef.current!);
            setPhase("failed");
            setError(t("failed"));
          }
        } catch {
          // ignore transient poll errors
        }
      }, 3000);
    } catch (err) {
      console.error("[UploadProgress]", err);
      setPhase("failed");
      setError(t("failed"));
    }
  }

  function handleRetry() {
    setPhase("uploading");
    setUploadPct(0);
    setError(null);
    startFlow();
  }

  const isUploading = phase === "uploading";
  const isRendering = phase === "rendering";
  const isFailed = phase === "failed";

  // Fake rendering progress (we don't have SSE, so animate)
  const [renderPct, setRenderPct] = useState(0);
  useEffect(() => {
    if (phase !== "rendering") return;
    setRenderPct(10);
    const id = setInterval(() => {
      setRenderPct((p) => {
        if (p >= 90) { clearInterval(id); return 90; }
        return p + Math.random() * 8;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-orange-50 px-6 gap-8">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-5xl animate-pulse">
        {isFailed ? "❌" : phase === "done" ? "✅" : "🎬"}
      </div>

      <h1 className="text-2xl font-black text-stone-900 text-center">
        {isFailed ? t("failed") : t("title")}
      </h1>

      {!isFailed && (
        <div className="w-full max-w-xs flex flex-col gap-6">
          {/* Upload progress */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-700">
                {t("uploadingLabel")}
              </span>
              <span className={`text-sm font-bold ${isUploading ? "text-orange-600" : "text-green-600"}`}>
                {isUploading ? `${Math.round(uploadPct)}%` : "✓"}
              </span>
            </div>
            <Progress value={isUploading ? uploadPct : 100} className="h-3" />
          </div>

          {/* Render progress */}
          <div className={`flex flex-col gap-2 transition-opacity ${isUploading ? "opacity-40" : "opacity-100"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-700">
                {t("renderingLabel")}
              </span>
              <span className={`text-sm font-bold ${isRendering ? "text-orange-600" : phase === "done" ? "text-green-600" : "text-stone-400"}`}>
                {phase === "done" ? "✓" : isRendering ? `${Math.round(renderPct)}%` : "—"}
              </span>
            </div>
            <Progress value={phase === "done" ? 100 : isRendering ? renderPct : 0} className="h-3" />
          </div>

          {isRendering && (
            <p className="text-center text-stone-500 text-sm">{t("almostDone")}</p>
          )}
        </div>
      )}

      {isFailed && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            onClick={handleRetry}
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform"
          >
            {t("retry")}
          </button>
          <button
            onClick={() => router.push(`/${locale}/create`)}
            className="w-full border border-stone-300 text-stone-600 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
          >
            {t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}

/** Upload with XHR to track real progress percentage */
function uploadWithProgress(
  formData: FormData,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.send(formData);
  });
}
