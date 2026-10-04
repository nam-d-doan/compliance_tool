import { useLanguageStore } from "@/i18n";
import { cn } from "@/lib/utils";

/** Round VI / EN button, styled like the other top-bar buttons. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { language, toggleLanguage } = useLanguageStore();
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="Switch language / Đổi ngôn ngữ"
      title={
        language === "vi"
          ? "Tiếng Việt — bấm để chuyển sang English"
          : "English — click for Tiếng Việt"
      }
      data-no-translate
      className={cn(
        "flex size-[38px] shrink-0 items-center justify-center rounded-full border bg-[var(--nav-bg)] font-heading text-[11px] font-bold shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]",
        className,
      )}
    >
      {language.toUpperCase()}
    </button>
  );
}
