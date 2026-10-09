import { motion } from "motion/react";
import { Sun, Moon, Sparkles, Lock } from "lucide-react";
import { useThemeStore } from "@/stores";
import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { LoginForm } from "@/components/auth/LoginForm";
import { LangToggle } from "@/components/layout/LangToggle";
import { useAuthT } from "@/constants/i18n/auth";
import { useCommonT } from "@/constants/i18n/common";

const CHAIN_STEPS = [
  { label: "chainRegulation", color: "#8bd9c2" },
  { label: "chainAssignment", color: "#6e7bff" },
  { label: "chainObligation", color: "#ffe600" },
  { label: "chainCap", color: "#ff6a52" },
] as const;

export default function LoginPage() {
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useAuthT();
  const { t: tc } = useCommonT();

  return (
    <div className="relative flex min-h-svh items-center justify-center p-6 sm:p-10">
      <AuroraBackground />

      <div className="fixed top-6 right-6 z-10">
        <LangToggle />
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={tc("toggleTheme")}
        className="fixed top-6 right-[5.5rem] z-10 flex size-[38px] items-center justify-center rounded-full border bg-[var(--nav-bg)] shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]"
      >
        {theme === "dark" ? (
          <Moon className="size-[15px]" />
        ) : (
          <Sun className="size-[15px]" />
        )}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex w-full max-w-[980px] overflow-hidden rounded-[26px] border bg-card shadow-[var(--card-shadow)] backdrop-blur-2xl [border-color:var(--card-border)]"
      >
        {/* Brand panel — always dark, independent of the app theme, so its
            light text stays legible regardless of light/dark mode. */}
        <div
          className="relative hidden w-[420px] shrink-0 flex-col justify-between overflow-hidden rounded-l-[26px] border-r border-white/10 p-11 text-[#f1efea] lg:flex"
          style={{
            background: "linear-gradient(160deg, #201d28 0%, #14131a 100%)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex size-8 items-center justify-center rounded-[9px] border border-white/15 bg-[#17161b]">
              <span className="text-chart-accent font-heading text-xs font-extrabold">
                EY
              </span>
            </div>
            <span className="font-heading text-base font-bold">
              Compliance Tool
            </span>
          </motion.div>

          <div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-heading text-[27px] leading-[1.35] font-bold tracking-tight"
            >
              {t("heroTitle")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 mb-8 text-[13.5px] leading-relaxed text-[#b7b4c8]"
            >
              {t("heroSubtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 flex items-center"
            >
              {CHAIN_STEPS.map((step, index) => (
                <div key={step.label} className="contents">
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="animate-chain-glow size-2.5 rounded-full"
                      style={
                        {
                          background: step.color,
                          "--gc": step.color,
                          animationDelay: `${index * 1.2}s`,
                        } as React.CSSProperties
                      }
                    />
                    <div
                      className="animate-chain-label-glow text-[9.5px]"
                      style={{ animationDelay: `${index * 1.2}s` }}
                    >
                      {t(step.label)}
                    </div>
                  </div>
                  {index < CHAIN_STEPS.length - 1 && (
                    <div
                      className="-mt-4 h-[1.5px] flex-[1.3]"
                      style={{
                        background: `linear-gradient(90deg, ${step.color}, ${CHAIN_STEPS[index + 1].color})`,
                      }}
                    />
                  )}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-3 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-3.5"
            >
              <Sparkles className="text-chart-accent mt-0.5 size-[15px] shrink-0" />
              <div>
                <p className="text-[12.5px] font-bold">{t("copilotTitle")}</p>
                <p className="mt-0.5 text-[11.5px] text-[#b7b4c8]">
                  {t("copilotDesc")}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-3.5"
            >
              <Lock className="mt-0.5 size-[15px] shrink-0 text-[#b7b4c8]" />
              <div>
                <p className="text-[12.5px] font-bold">
                  {t("securityTitle")}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#b7b4c8]">
                  {t("securityDesc")}
                </p>
              </div>
            </motion.div>
          </div>

          <p className="text-[11px] text-[#8a889c]">
            &copy; {new Date().getFullYear()} {t("copyright")}
          </p>
        </div>

        {/* Form panel */}
        <div className="flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 lg:w-auto lg:flex-1">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#17161b]">
              <span className="text-chart-accent font-heading text-sm font-extrabold">
                EY
              </span>
            </div>
            <span className="text-lg font-semibold">Compliance Tool</span>
          </div>
          <LoginForm />
        </div>
      </motion.div>
    </div>
  );
}
