import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface PageHeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Page hero banner — navy→blue→teal gradient per FDM design language.
 * Use on dashboard headers and major module landing/detail pages.
 */
export function PageHero({
  title,
  subtitle,
  children,
  className,
}: PageHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c3767] via-[#185b95] to-[#147769] px-6 py-7 text-white shadow-md sm:px-8",
        className,
      )}
    >
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-2xl text-sm text-blue-100">{subtitle}</p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </motion.div>
  );
}
