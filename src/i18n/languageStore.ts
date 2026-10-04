import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "vi" | "en";

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

/**
 * Interface language. Vietnamese is the default (the bank's working
 * language); English is one click away in the top bar.
 */
export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "vi",
      setLanguage: (language) => set({ language }),
      toggleLanguage: () =>
        set({ language: get().language === "vi" ? "en" : "vi" }),
    }),
    { name: "language-storage" },
  ),
);
