"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorPanelProps {
  hook: string;
  caption: string;
}

export default function EditorPanel({ hook, caption }: EditorPanelProps) {
  const t = useTranslations("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older Safari
      const ta = document.createElement("textarea");
      ta.value = caption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Hook */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
          {t("hookLabel")}
        </span>
        <p className="text-stone-800 font-bold text-base leading-snug">{hook}</p>
      </div>

      {/* Caption */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            {t("captionLabel")}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full transition-colors",
              copied
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t("captionCopied")}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t("copyCaption")}
              </>
            )}
          </button>
        </div>
        <p className="text-stone-600 text-sm leading-relaxed bg-stone-50 rounded-xl p-3 border border-stone-100">
          {caption}
        </p>
      </div>
    </div>
  );
}
