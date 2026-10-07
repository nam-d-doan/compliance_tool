import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Nam review — "thêm chế độ tiếng Việt" cho LM (phạm vi: chỉ module LM,
 * LAW làm sau). Viết riêng nhẹ, KHÔNG tái dùng hệ i18n ~3500 dòng của
 * nhánh `nam-a-cms-demo` (pattern-based translator dịch toàn site) — nhánh
 * đó chưa merge vào `dev`, kéo vào feat/law lúc này tạo phụ thuộc vào code
 * chưa review + over-engineer cho việc chỉ cần 1 module. Xem
 * docs/lm/02-review-changes.md để biết bối cảnh review tổng thể.
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
      name: "lm-language-storage",
    },
  ),
);
