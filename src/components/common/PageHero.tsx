import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface PageHeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Plain page header — title + subtitle + action row, no card chrome. Sits
 * directly on the aurora page background, matching the ComplianceAI design
 * language's flat headers (as opposed to a colored banner).
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
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </motion.div>
  );
}
