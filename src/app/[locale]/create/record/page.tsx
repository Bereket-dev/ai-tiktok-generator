"use client";

import { useSessionStore } from "@/store/session";
import { useTranslations } from "next-intl";
import { getPromptPack } from "@/lib/prompts";
import CameraRecorder from "@/components/CameraRecorder";
import type { PromptKey } from "@/lib/prompts";
import type { SupportedLocale } from "@/i18n";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RecordPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as SupportedLocale;
  const t = useTranslations("record");
  const { selectedPromptKey } = useSessionStore();

  useEffect(() => {
    if (!selectedPromptKey) {
      router.replace(`/${locale}/create`);
    }
  }, [selectedPromptKey, locale, router]);

  if (!selectedPromptKey) return null;

  const pack = getPromptPack(selectedPromptKey as PromptKey, locale);

  return (
    <CameraRecorder
      locale={locale}
      promptKey={selectedPromptKey}
      promptHint={pack.recordingTip}
    />
  );
}
