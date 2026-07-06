import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  format,
  parseISO,
  addMonths,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  differenceInDays,
} from "date-fns";
import {
  Shield,
  AlertTriangle,
  Clock,
  Ban,
  RefreshCw,
  Calendar,
  TrendingUp,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/common/KPICard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/Skeletons";
import { LicenseCard } from "@/components/license/LicenseCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { useLicenseList } from "@/hooks/queries/useLicenseQueries";
import type { License } from "@/types";

const DEPARTMENTS = [
  "Risk & Compliance",
  "Legal",
  "Operations",
  "Finance",
  "Treasury",
  "Retail Banking",
  "Corporate Banking",
  "IT Security",
  "Human Resources",
  "Internal Audit",
];

function getUrgencyColor(days: number) {
  if (days < 0) return "text-red-600 dark:text-red-400";
  if (days <= 30) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

export default function LicenseDashboardPage() {
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useLicenseList({}, 1, 500);
  const licenses = data?.items ?? [];

  const today = new Date();

  const stats = useMemo(() => {
    const total = licenses.length;
    const active = licenses.filter((l) => l.status === "Active").length;
    const expiring30 = licenses.filter(
      (l) => l.remainingDays >= 0 && l.remainingDays <= 30,
    ).length;
    const expiring60 = licenses.filter(
      (l) => l.remainingDays > 30 && l.remainingDays <= 60,
    ).length;
    const expiring90 = licenses.filter(
      (l) => l.remainingDays > 60 && l.remainingDays <= 90,
    ).length;
    const expired = licenses.filter((l) => l.status === "Expired").length;
    const suspended = licenses.filter((l) => l.status === "Suspended").length;
    const renewed = licenses.filter((l) => l.status === "Renewed").length;

    const priority = {
      critical: licenses.filter((l) => l.renewalPriority === "critical").length,
      high: licenses.filter((l) => l.renewalPriority === "high").length,
      medium: licenses.filter((l) => l.renewalPriority === "medium").length,
      low: licenses.filter((l) => l.renewalPriority === "low").length,
    };

    const statusData = [
      { name: "Active", value: active, color: "var(--chart-1)" },
      {
        name: "Expiring Soon",
        value: expiring30 + expiring60,
        color: "var(--chart-2)",
      },
      { name: "Expired", value: expired, color: "var(--chart-3)" },
      { name: "Suspended", value: suspended, color: "var(--chart-4)" },
      { name: "Renewed", value: renewed, color: "var(--chart-5)" },
    ].filter((d) => d.value > 0);

    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStart = startOfMonth(addMonths(today, i));
      return {
        label: format(monthStart, "MMM yy"),
        start: monthStart,
        end: endOfMonth(monthStart),
      };
    });

    const expiryTimeline = months.map((m) => ({
      name: m.label,
      count: licenses.filter((l) => {
        const expiry = parseISO(l.expiryDate);
        return isSameMonth(expiry, m.start);
      }).length,
    }));

    const departmentData = DEPARTMENTS.map((dept) => ({
      name: dept,
      count: licenses.filter((l) => l.department === dept).length,
    }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);

    const priorityData = [
      { name: "Critical", value: priority.critical, color: "var(--chart-3)" },
      { name: "High", value: priority.high, color: "var(--chart-2)" },
      { name: "Medium", value: priority.medium, color: "var(--chart-4)" },
      { name: "Low", value: priority.low, color: "var(--chart-1)" },
    ].filter((d) => d.value > 0);

    const expiringSoon = licenses
      .filter((l) => l.remainingDays >= 0 && l.remainingDays <= 30)
      .sort((a, b) => a.remainingDays - b.remainingDays)
      .slice(0, 5);

    const needsAttention = licenses
      .filter((l) => l.status === "Expired" || l.status === "Suspended")
      .slice(0, 5);

    return {
      total,
      active,
      expiring30,
      expiring60,
      expiring90,
      expired,
      suspended,
      renewed,
      priority,
      statusData,
      expiryTimeline,
      departmentData,
      priorityData,
      expiringSoon,
      needsAttention,
    };
  }, [licenses, today]);

  const handleNavigate = (id: string) => navigate(`/license/${id}`);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c3767] via-[#185b95] to-[#147769] p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              License Management
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-white/80">
              Track regulatory licenses, monitor expiry timelines, and manage
              renewals across the organization.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/license/list")}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              View All Licenses
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/license/add")}
              className="bg-white text-[#0c3767] hover:bg-white/90"
            >
              Add License
            </Button>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
              <Shield className="size-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-white/70">Total Licenses</p>
              <p className="text-lg font-semibold">
                {isPending ? "-" : stats.total}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
              <AlertTriangle className="size-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-white/70">Expiring in 30 Days</p>
              <p className="text-lg font-semibold">
                {isPending ? "-" : stats.expiring30}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
              <FileWarning className="size-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-white/70">Expired / Suspended</p>
              <p className="text-lg font-semibold">
                {isPending ? "-" : stats.expired + stats.suspended}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Active Licenses"
          value={isPending ? 0 : stats.active}
          icon={Shield}
          loading={isPending}
          trend={{
            direction: "up",
            percent:
              stats.total > 0
                ? Math.round((stats.active / stats.total) * 100)
                : 0,
            positive: true,
          }}
        />
        <KPICard
          label="Expiring Soon"
          value={
            isPending
              ? 0
              : stats.expiring30 + stats.expiring60 + stats.expiring90
          }
          icon={Clock}
          loading={isPending}
          subtitle={`${stats.expiring30} <30d · ${stats.expiring60} 31-60d · ${stats.expiring90} 61-90d`}
          trend={{
            direction:
              stats.expiring30 + stats.expiring60 + stats.expiring90 > 0
                ? "up"
                : "flat",
            percent: stats.expiring30 + stats.expiring60 + stats.expiring90,
            positive: false,
          }}
        />
        <KPICard
          label="Expired"
          value={isPending ? 0 : stats.expired}
          icon={AlertTriangle}
          loading={isPending}
          trend={{
            direction: stats.expired > 0 ? "up" : "flat",
            percent: stats.expired,
            positive: false,
          }}
        />
        <KPICard
          label="Suspended"
          value={isPending ? 0 : stats.suspended}
          icon={Ban}
          loading={isPending}
          trend={{
            direction: stats.suspended > 0 ? "up" : "flat",
            percent: stats.suspended,
            positive: false,
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <RefreshCw
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Renewal Priority Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Critical</p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  {stats.priority.critical}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                  {stats.priority.high}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Medium</p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {stats.priority.medium}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {stats.priority.low}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <PieChartCard
          title="Licenses by Status"
          data={stats.statusData}
          nameKey="name"
          valueKey="value"
          loading={isPending}
        />
        <BarChartCard
          title="Expiry Timeline"
          subtitle="Licenses expiring in the next 12 months"
          data={stats.expiryTimeline}
          xKey="name"
          yKeys={[{ key: "count", name: "Licenses" }]}
          loading={isPending}
        />
        <BarChartCard
          title="Licenses by Department"
          data={stats.departmentData}
          xKey="name"
          yKeys={[{ key: "count", name: "Licenses" }]}
          loading={isPending}
        />
        <BarChartCard
          title="Renewal Priority Distribution"
          data={stats.priorityData}
          xKey="name"
          yKeys={[{ key: "value", name: "Licenses" }]}
          loading={isPending}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <ListSkeleton items={3} />
            ) : stats.expiringSoon.length === 0 ? (
              <EmptyState
                title="No licenses expiring soon"
                description="All licenses are current."
                className="min-h-[12rem]"
              />
            ) : (
              <div className="space-y-3">
                {stats.expiringSoon.map((license) => (
                  <LicenseCard
                    key={license.id}
                    item={license}
                    onClick={() => handleNavigate(license.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <ListSkeleton items={3} />
            ) : stats.needsAttention.length === 0 ? (
              <EmptyState
                title="Nothing needs attention"
                description="No expired or suspended licenses."
                className="min-h-[12rem]"
              />
            ) : (
              <div className="space-y-3">
                {stats.needsAttention.map((license) => (
                  <LicenseCard
                    key={license.id}
                    item={license}
                    onClick={() => handleNavigate(license.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
