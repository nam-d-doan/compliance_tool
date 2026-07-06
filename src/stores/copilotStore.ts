import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AICopilotMessage } from "@/types";

interface CopilotState {
  isOpen: boolean;
  thread: AICopilotMessage[];
  isGenerating: boolean;
  threadId: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (message: AICopilotMessage) => void;
  clearThread: () => void;
  setGenerating: (isGenerating: boolean) => void;
}

export const useCopilotStore = create<CopilotState>()(
  persist(
    (set) => ({
      isOpen: false,
      thread: [],
      isGenerating: false,
      threadId: null,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      addMessage: (message) =>
        set((state) => ({
          thread: [...state.thread, message],
          threadId: state.threadId ?? message.threadId,
        })),
      clearThread: () => set({ thread: [], threadId: null }),
      setGenerating: (isGenerating) => set({ isGenerating }),
    }),
    {
      name: "copilot-storage",
      partialize: (state) => ({
        thread: state.thread,
        isOpen: state.isOpen,
        threadId: state.threadId,
      }),
    },
  ),
);
