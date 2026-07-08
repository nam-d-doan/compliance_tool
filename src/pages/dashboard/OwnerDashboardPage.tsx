import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { format, differenceInDays } from "date-fns";
import {
  ClipboardCheck,
  ClipboardList,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { PageHero, ErrorState } from "@/components/common";
import { CardSkeleton, ListSkeleton } from "@/components/common/Skeletons";
import {
  MyCAPsWidget,
  ObligationOverviewCard,
  ObligationProgressRing,
} from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/common";
import { useAuthStore } from "@/stores";
import {
  useObligationList,
  useCAPList,
  useAssignmentList,
} from "@/hooks/queries";
import {
  buildCapObligationMap,
  getOrphanedAttentionObligations,
  isOverdue,
} from "@/lib/obligation-helpers";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { Obligation } from "@/types";

/** Assignment statuses that represent live work for a department. */
const ACTIVE_ASSIGNMENT_STATUSES = ["published", "acknowledged", "in_progress"];

function useOwnerData() {
  const { user } = useAuthStore();
  const ownerId = user?.id ?? "";

  // Obligations owned by this user — drives the department derivation and the
  // obligation overview. CAPs are loaded broadly (not owner-scoped) so the
  // effective-status derivation can see every plan linked to these obligations,
  // even one owned by someone else.
  const obligations = useObligationList(
    ownerId ? { owner: ownerId } : {},
    1,
    500,
  );
  const caps = useCAPList({}, 1, 500);

  // Department is not yet on AuthUser (separate admin work). Derive it from the
  // owner's obligations' denormalized department field — stable because every
  // user belongs to exactly one HO department.
  const deptId = useMemo(
    () =>
      obligations.data?.items.find((o) => o.ownerDepartmentId)
        ?.ownerDepartmentId,
    [obligations.data],
  );
  const assignments = useAssignmentList(
    deptId ? { department: deptId } : {},
    1,
    500,
  );

  const isLoading =
    obligations.isPending ||
    caps.isPending ||
    (Boolean(deptId) && assignments.isPending);
  const error = obligations.error ?? caps.error ?? assignments.error;

  return { user, ownerId, obligations, caps, assignments, isLoading, error };
}

export default function OwnerDashboardPage() {
  const { user, ownerId, obligations, caps, assignments, isLoading, error } =
    useOwnerData();

  const obligationItems = useMemo(
    () => obligations.data?.items ?? [],
    [obligations.data],
  );
  const capItems = useMemo(() => caps.data?.items ?? [], [caps.data]);
  const assignmentItems = useMemo(
    () => assignments.data?.items ?? [],
    [assignments.data],
  );

  // Owner-scoped action plans for the "My CAPs" view + KPIs.
  const myCaps = useMemo(
    () => capItems.filter((c) => c.ownerId === ownerId),
    [capItems, ownerId],
  );
  // Reverse map (obligationId -> all linked CAPs) for effective-status logic.
  const capMap = useMemo(() => buildCapObligationMap(capItems), [capItems]);
  // Orphaned obligations needing attention (no CAP yet).
  const orphaned = useMemo(
    () => getOrphanedAttentionObligations(obligationItems, capMap),
    [obligationItems, capMap],
  );

  const deptName = obligationItems.find(
    (o) => o.ownerDepartmentName,
  )?.ownerDepartmentName;
  const activeAssignments = assignmentItems.filter((a) =>
    ACTIVE_ASSIGNMENT_STATUSES.includes(a.status),
  );
  const capOpen = myCaps.filter((c) => c.status !== "Closed").length;
  const capClosed = myCaps.filter((c) => c.status === "Closed").length;
  const capPercent = myCaps.length
    ? Math.round((capClosed / myCaps.length) * 100)
    : 0;

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
          title="My CAPs"
          subtitle={`Compliance workspace for ${user?.name ?? "you"}.`}
        />
        <ErrorState
          title="Could not load your dashboard"
          message={error.message}
          onRetry={() => {
            obligations.refetch();
            caps.refetch();
            assignments.refetch();
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
        title="My CAPs"
        subtitle={`Compliance workspace for ${user?.name ?? "you"} · ${myCaps.length} action plans${deptName ? ` · ${deptName}` : ""}`}
      />

      {/* KPI row: action plans, review assignments, attention, CAP completion */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Action Plans"
          value={myCaps.length}
          icon={ClipboardCheck}
          tint="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          subtitle={`${capOpen} open`}
          delay={0.05}
        />
        <StatCard
          label="Review Assignments"
          value={activeAssignments.length}
          icon={ClipboardList}
          tint="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          subtitle={deptName ? `for ${deptName}` : "active for your department"}
          delay={0.1}
        />
        <StatCard
          label="Needs Attention"
          value={orphaned.length}
          icon={AlertTriangle}
          tint="bg-red-500/10 text-red-600 dark:text-red-400"
          subtitle="obligations need a CAP"
          delay={0.15}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="flex h-full items-center justify-center py-6">
            <CardContent className="p-0">
              <ObligationProgressRing
                ring={{
                  completed: capClosed,
                  total: myCaps.length,
                  percent: capPercent,
                }}
                label="CAPs closed"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Items requiring attention — orphaned obligations with no CAP */}
      <AttentionSection obligations={orphaned} />

      {/* My CAPs — the focus of the dashboard */}
      <MyCAPsWidget caps={myCaps} />

      {/* Obligation overview — demoted to priority + status stats */}
      <ObligationOverviewCard obligations={obligationItems} capMap={capMap} />
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

/** Consolidated attention list: orphaned obligations that need a CAP created. */
function AttentionSection({ obligations }: { obligations: Obligation[] }) {
  const navigate = useNavigate();
  if (obligations.length === 0) return null;

  const visible = obligations.slice(0, 5);
  const overflow = obligations.length - visible.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.06] via-orange-500/[0.03] to-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-red-500/15 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Items Requiring Attention
            </h2>
            <p className="text-xs text-muted-foreground">
              {obligations.length} obligation
              {obligations.length === 1 ? "" : "s"} need
              {obligations.length === 1 ? "s" : ""} a corrective action plan
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          onClick={() => navigate("/obligations")}
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>

      <ul className="divide-y divide-border/60">
        {visible.map((obg, idx) => {
          const overdue = isOverdue(obg);
          const dueDate = new Date(obg.dueDate);
          const daysLeft = differenceInDays(dueDate, new Date());
          return (
            <motion.li
              key={obg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.3) }}
              className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="shrink-0 border-border bg-muted/50 font-mono text-[11px] font-medium text-muted-foreground"
                  >
                    {obg.articleRef}
                  </Badge>
                  <h3 className="truncate text-sm font-medium text-foreground">
                    {obg.title}
                  </h3>
                  <PriorityBadge priority={obg.riskLevel} size="sm" />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      "font-medium",
                      overdue
                        ? "text-red-600 dark:text-red-400"
                        : daysLeft <= 7
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {overdue
                      ? `Overdue ${Math.abs(daysLeft)}d`
                      : daysLeft === 0
                        ? "Due today"
                        : `Due ${format(dueDate, "MMM d")}`}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigate(`/cap/create?obligations=${obg.id}`)}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Create CAP
                </Button>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {overflow > 0 && (
        <div className="px-4 py-2.5">
          <Button
            variant="ghost"
            size="xs"
            className="w-full justify-center text-muted-foreground"
            onClick={() => navigate("/obligations")}
          >
            View {overflow} more in Obligations
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}
    </motion.section>
  );
}
