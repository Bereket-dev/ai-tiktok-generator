import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SupportedLocale } from "@/i18n";
import type { PromptKey } from "@/lib/prompts";

interface SessionState {
  locale: SupportedLocale;
  selectedPromptKey: PromptKey | null;
  projectId: string | null;
  renderId: string | null;
  sessionId: string;

  setLocale: (locale: SupportedLocale) => void;
  setSelectedPromptKey: (key: PromptKey) => void;
  setProjectId: (id: string) => void;
  setRenderId: (id: string) => void;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      locale: "am",
      selectedPromptKey: null,
      projectId: null,
      renderId: null,
      sessionId: generateSessionId(),

      setLocale: (locale) => set({ locale }),
      setSelectedPromptKey: (key) => set({ selectedPromptKey: key }),
      setProjectId: (id) => set({ projectId: id }),
      setRenderId: (id) => set({ renderId: id }),
    }),
    {
      name: "tiktok-creator-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        locale: state.locale,
        sessionId: state.sessionId,
      }),
    }
  )
);
