import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
  Clock,
  Eye,
} from "lucide-react";
import { PageHero, ErrorState } from "@/components/common";
import { CardSkeleton, ListSkeleton } from "@/components/common/Skeletons";
import {
  MyObligationsWidget,
  NeedsCAPAlerts,
  ObligationProgressRing,
} from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores";
import { useObligationList, useCAPList } from "@/hooks/queries";
import {
  getSummaryStats,
  getObligationsRing,
  getNeedsCapsForOwner,
} from "@/lib/obligation-helpers";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

function useOwnerObligations() {
  const { user } = useAuthStore();
  const ownerId = user?.id ?? "";

  const obligations = useObligationList(
    ownerId ? { owner: ownerId } : {},
    1,
    500,
  );
  const caps = useCAPList({}, 1, 500);

  const isLoading = obligations.isPending || caps.isPending;
  const error = obligations.error ?? caps.error;

  return { user, ownerId, obligations, caps, isLoading, error };
}

export default function OwnerDashboardPage() {
  const { user, ownerId, obligations, caps, isLoading, error } =
    useOwnerObligations();

  const obligationItems = useMemo(
    () => obligations.data?.items ?? [],
    [obligations.data],
  );
  const capItems = useMemo(() => caps.data?.items ?? [], [caps.data]);

  const stats = useMemo(
    () => getSummaryStats(obligationItems, capItems),
    [obligationItems, capItems],
  );
  const ring = useMemo(
    () => getObligationsRing(obligationItems),
    [obligationItems],
  );
  const needsCapItems = useMemo(
    () => getNeedsCapsForOwner(obligationItems, capItems),
    [obligationItems, capItems],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHero
          title="My Obligations"
          subtitle={`Compliance workspace for ${user?.name ?? "you"}.`}
        />
        <ErrorState
          title="Could not load your dashboard"
          message={error.message}
          onRetry={() => {
            obligations.refetch();
            caps.refetch();
          }}
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
      <PageHero
        title="My Obligations"
        subtitle={`Compliance workspace for ${user?.name ?? "you"} · ${stats.total} obligations owned`}
      />

      {/* Needs CAP alerts — shown only when there are items */}
      <NeedsCAPAlerts items={needsCapItems} ownerId={ownerId} />

      {/* KPI row: total, need-attention breakdown, completed, progress ring */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Obligations"
          value={stats.total}
          icon={ListChecks}
          tint="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          subtitle={`${stats.completed} completed`}
          delay={0.05}
        />
        <NeedAttentionCard stats={stats} delay={0.1} />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          subtitle={`${ring.percent}% of total`}
          delay={0.15}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="flex h-full items-center justify-center py-6">
            <CardContent className="p-0">
              <ObligationProgressRing ring={ring} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* My Obligations widget — the focus of the dashboard */}
      <MyObligationsWidget obligations={obligationItems} caps={capItems} />
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tint: string;
  subtitle?: string;
  delay?: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  subtitle,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="h-full">
        <CardContent className="flex items-start justify-between p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              tint,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface NeedAttentionCardProps {
  stats: ReturnType<typeof getSummaryStats>;
  delay?: number;
}

/**
 * Explodes the "Need Attention" count into its three driving types with
 * colour coding: overdue → red, critical-risk → red, review_required → amber.
 */
function NeedAttentionCard({ stats, delay = 0 }: NeedAttentionCardProps) {
  const breakdown = [
    {
      label: "Overdue",
      value: stats.overdue,
      icon: Clock,
      tone: "text-red-600 dark:text-red-400",
      dot: "bg-red-500",
    },
    {
      label: "Critical risk",
      value: stats.critical,
      icon: ShieldAlert,
      tone: "text-red-600 dark:text-red-400",
      dot: "bg-red-500",
    },
    {
      label: "Review required",
      value: stats.reviewRequired,
      icon: Eye,
      tone: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Need Attention
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {stats.needAttention}
              </p>
            </div>
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                "bg-red-500/10 text-red-600 dark:text-red-400",
              )}
            >
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
            {breakdown.map((row) => {
              const Icon = row.icon;
              return (
                <li
                  key={row.label}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Icon
                      className={cn("size-3.5", row.tone)}
                      aria-hidden="true"
                    />
                    {row.label}
                  </span>
                  <span className={cn("font-semibold", row.tone)}>
                    {row.value}
                  </span>
                </li>
              );
            })}
          </ul>
          {stats.needsCap > 0 && (
            <div className="mt-3 flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
              <ClipboardCheck className="size-3.5" aria-hidden="true" />
              {stats.needsCap} need a CAP
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
