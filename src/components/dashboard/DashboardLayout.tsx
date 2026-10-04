import { motion } from "motion/react";
import {
  CardSkeleton,
  ListSkeleton,
  ChartSkeleton,
} from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import { useAuthStore } from "@/stores";
import { getGreeting } from "@/lib/greeting";
import { AISummaryLine } from "./AISummaryLine";
import { cn } from "@/lib/utils";
import { CmsSummaryStrip } from "./CmsSummaryStrip";
import { CmsFeatureMap } from "./CmsFeatureMap";

interface DashboardLayoutProps {
  /** Fallback shown as the AI summary line when the page has no dynamic
   * summary of its own ready yet. */
  title: string;
  subtitle?: string;
  kpis: React.ReactNode[];
  children: React.ReactNode;
  /** Optional action buttons rendered on the right side of the header. */
  actions?: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function DashboardLayout({
  title,
  subtitle,
  kpis,
  children,
  actions,
  isLoading,
  error,
  onRetry,
}: DashboardLayoutProps) {
  const { user } = useAuthStore();
  const greeting = getGreeting(user?.name ?? "there");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 w-2/3 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ChartSkeleton />
          <ChartSkeleton />
          <ListSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
            {greeting}
          </h1>
          <AISummaryLine text={subtitle ?? title} />
        </div>
        <ErrorState
          title="Could not load dashboard"
          message={error.message}
          onRetry={onRetry}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
            {greeting}
          </h1>
          <AISummaryLine text={subtitle ?? title} />
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <CmsFeatureMap delay={0.05} />

      <CmsSummaryStrip delay={0.1} />

      <div
        className={cn(
          "grid gap-4",
          kpis.length > 4
            ? "sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6"
            : "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {kpis.map((kpi, index) => (
          <div key={index} className="min-w-0">
            {kpi}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>
    </motion.div>
  );
}
