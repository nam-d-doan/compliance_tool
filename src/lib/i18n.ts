/**
 * PSEUDO CODE — i18n nhẹ cho toàn demo (Nam yêu cầu: có chế độ tiếng Việt)
 * 1. Mỗi module có 1 dictionary phẳng { key: { en, vi } } riêng, tạo hook
 *    bằng createUseT(dict) → trang gọi `t("key")`. Key sai = lỗi TypeScript.
 * 2. Nhãn dùng chung nhiều nơi (trạng thái, ưu tiên, menu, vai trò) đã có
 *    sẵn dạng chuỗi tiếng Anh trong constants → tra qua bảng VI_TERMS theo
 *    chính chuỗi đó (translateTerm), thiếu thì giữ tiếng Anh.
 * 3. Dữ liệu người dùng nhập (tên hồ sơ, mô tả...) KHÔNG dịch.
 */
import { vi } from "date-fns/locale";
import { useLanguageStore, type Lang } from "@/stores";
import { VI_TERMS } from "@/constants/i18n/terms";

export type Dict = Record<string, { en: string; vi: string }>;

export function createUseT<D extends Dict>(dict: D) {
  return function useT() {
    const lang = useLanguageStore((s) => s.lang);
    const toggleLang = useLanguageStore((s) => s.toggleLang);
    const t = (key: keyof D): string => dict[key][lang];
    return { t, lang, toggleLang };
  };
}

export function translateTerm(label: string, lang: Lang): string {
  return lang === "vi" ? (VI_TERMS[label] ?? label) : label;
}

/**
 * Song ngữ tại chỗ: `L("Open", "Đang mở")`. Dùng cho câu động (số nhiều,
 * nội suy) hoặc trang nhiều chuỗi chỉ dùng 1 lần — đỡ phải tạo key.
 */
export function useL() {
  const lang = useLanguageStore((s) => s.lang);
  return (en: string, vi: string) => (lang === "vi" ? vi : en);
}

/** Cặp [en, vi] cho cấu hình tĩnh ngoài component; render bằng `L(...pair)`. */
export type Bi = readonly [en: string, vi: string];

/** Locale cho date-fns `format`/`formatDistanceToNow` (tên tháng, "3 ngày trước"). */
export function useDateLocale() {
  const lang = useLanguageStore((s) => s.lang);
  return lang === "vi" ? vi : undefined;
}

export function useTerm() {
  const lang = useLanguageStore((s) => s.lang);
  return (label: string) => translateTerm(label, lang);
}
