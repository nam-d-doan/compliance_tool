import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Ngôn ngữ hiển thị toàn demo (EN/VI), đổi bằng nút trên TopNav. Viết riêng
 * nhẹ, KHÔNG tái dùng hệ i18n ~3500 dòng của nhánh `nam-a-cms-demo` (chưa
 * merge vào `dev`). Cách dùng: xem src/lib/i18n.ts.
 */
export type Lang = "en" | "vi";

interface LanguageStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === "en" ? "vi" : "en" }),
    }),
    {
      name: "language-storage",
    },
  ),
);
