import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PromptKey } from "@/lib/prompts";

interface SessionState {
  selectedPromptKey: PromptKey | null;
  projectId: string | null;
  renderId: string | null;
  sessionId: string;

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
      selectedPromptKey: null,
      projectId: null,
      renderId: null,
      sessionId: generateSessionId(),

      setSelectedPromptKey: (key) => set({ selectedPromptKey: key }),
      setProjectId: (id) => set({ projectId: id }),
      setRenderId: (id) => set({ renderId: id }),
    }),
    {
      name: "tiktok-creator-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
      }),
    }
  )
);
