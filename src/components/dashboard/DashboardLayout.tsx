import { motion } from "motion/react";
import { format } from "date-fns";
import {
  CardSkeleton,
  ListSkeleton,
  ChartSkeleton,
} from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHero } from "@/components/common/PageHero";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  kpis: React.ReactNode[];
  children: React.ReactNode;
  /** Optional action buttons rendered on the right side of the hero banner. */
  actions?: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return name ? `Good ${period}, ${name}` : `Good ${period}`;
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
  const greeting = getGreeting(user?.name?.split(" ")[0]);
  const heroSubtitle = subtitle
    ? `${greeting} · ${subtitle}`
    : `${greeting} · ${format(new Date(), "EEEE, MMMM do, yyyy")}`;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
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
        <PageHero title={title} subtitle={heroSubtitle} />
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
      <PageHero title={title} subtitle={heroSubtitle}>
        {actions}
      </PageHero>

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </motion.div>
  );
}
