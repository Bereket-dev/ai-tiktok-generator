"use client";

import { useParams } from "next/navigation";
import SelfieCam from "@/components/SelfieCam";
import type { SupportedLocale } from "@/i18n";

export default function SnapPage() {
  const params = useParams();
  const locale = params.locale as SupportedLocale;
  return <SelfieCam locale={locale} />;
}
