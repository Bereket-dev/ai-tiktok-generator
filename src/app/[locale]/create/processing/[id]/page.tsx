"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useSessionStore } from "@/store/session";
import UploadProgress from "@/components/UploadProgress";
import type { SupportedLocale } from "@/i18n";

export default function ProcessingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as SupportedLocale;
  const { selectedPromptKey } = useSessionStore();

  const draftKey = searchParams.get("draft") ?? "";
  const promptKey = searchParams.get("prompt") ?? selectedPromptKey ?? "surprise_me";

  return (
    <UploadProgress
      locale={locale}
      draftKey={draftKey}
      promptKey={promptKey}
    />
  );
}
