import { Languages } from "lucide-react";
import { useCommonT } from "@/constants/i18n/common";

/** Nhãn là ngôn ngữ SẼ chuyển sang (đang EN thì hiện "VI"). */
export function LangToggle() {
  const { t, toggleLang } = useCommonT();
  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t("langToggleAria")}
      title={t("langToggleAria")}
      className="flex h-[38px] shrink-0 items-center gap-1.5 rounded-[19px] border bg-[var(--nav-bg)] px-3 text-xs font-bold shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]"
    >
      <Languages className="size-[15px]" aria-hidden="true" />
      {t("langToggle")}
    </button>
  );
}
