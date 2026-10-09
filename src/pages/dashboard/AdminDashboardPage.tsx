import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DashboardLayout,
  DashboardKpiCard,
  DashboardChartCard,
  DashboardAdminStats,
  DashboardActivityFeed,
} from "@/components/dashboard";
import {
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import { useDashboard } from "@/hooks/queries";
import {
  useAdminUsers,
  useAdminAuditLogs,
  useAdminAIConfig,
} from "@/hooks/queries/useAdminQueries";
import { CHART_COLORS } from "@/components/charts/chart-theme";
import { DEMO_TODAY } from "@/mocks/db";
import type { ActivityFeedItem } from "@/types";
import { useL, useTerm } from "@/lib/i18n";
import { useLanguageStore } from "@/stores";

function useAdminData() {
  const dashboard = useDashboard("admin");
  const users = useAdminUsers(1, 500);
  const auditLogs = useAdminAuditLogs(1, 100);
  const aiConfig = useAdminAIConfig();

  const isLoading =
    dashboard.isPending ||
    users.isPending ||
    auditLogs.isPending ||
    aiConfig.isPending;
  const error =
    dashboard.error ?? users.error ?? auditLogs.error ?? aiConfig.error;

  return {
    dashboard,
    users,
    auditLogs,
    aiConfig,
    isLoading,
    error,
  };
}

export default function AdminDashboardPage() {
  const { dashboard, users, auditLogs, aiConfig, isLoading, error } =
    useAdminData();
  const L = useL();
  const term = useTerm();
  const lang = useLanguageStore((s) => s.lang);
  const dateLocaleTag = lang === "vi" ? "vi-VN" : "en-US";

  const userItems = useMemo(() => users.data?.items ?? [], [users.data]);
  const auditItems = useMemo(
    () => auditLogs.data?.items ?? [],
    [auditLogs.data],
  );

  const activeUserCount = useMemo(
    () => userItems.filter((u) => u.status === "Active").length,
    [userItems],
  );

  const userActivity = useMemo(() => {
    const counts = new Map<string, number>();
    userItems.forEach((user) => {
      const role = user.role;
      counts.set(role, (counts.get(role) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: term(name),
      value,
    }));
  }, [userItems, term]);

  const auditEvents = useMemo(() => {
    const grouped = new Map<string, number>();
    auditItems.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleDateString(dateLocaleTag, {
        month: "short",
        day: "numeric",
      });
      grouped.set(date, (grouped.get(date) ?? 0) + 1);
    });
    return Array.from(grouped.entries())
      .slice(-7)
      .map(([name, value]) => ({ name, value }));
  }, [auditItems, dateLocaleTag]);

  const aiUsage = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(DEMO_TODAY);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const aiLogs = auditItems.filter((l) => l.action === "ai_usage");
    return days.map((day) => {
      const queries = aiLogs.filter((l) => {
        const t = new Date(l.timestamp);
        return (
          t.getFullYear() === day.getFullYear() &&
          t.getMonth() === day.getMonth() &&
          t.getDate() === day.getDate()
        );
      }).length;
      return {
        name: day.toLocaleDateString(dateLocaleTag, { weekday: "short" }),
        queries,
      };
    });
  }, [auditItems, dateLocaleTag]);

  const securityEvents = useMemo(() => {
    return auditItems
      .filter(
        (log) =>
          log.result === "failure" ||
          log.action === "login" ||
          log.action === "settings_change" ||
          log.action === "delete",
      )
      .map((log) => ({
        id: log.id,
        type: (log.result === "failure"
          ? "rejection"
          : log.action === "login"
            ? "submission"
            : "comment") as ActivityFeedItem["type"],
        title: `${log.action} · ${log.module}${log.result === "failure" ? L(" (failed)", " (thất bại)") : ""}`,
        description: log.details ?? "",
        userId: log.userId,
        userName: log.userName,
        entityType: "user" as const,
        entityId: log.object,
        timestamp: log.timestamp,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      }));
  }, [auditItems, L]);

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      <ErrorState
        title={L("Could not load admin dashboard", "Không tải được trang tổng quan quản trị")}
        message={error.message}
        onRetry={() => {
          dashboard.refetch();
          users.refetch();
          auditLogs.refetch();
          aiConfig.refetch();
        }}
      />
    );
  }

  return (
    <DashboardLayout
      title={L("Admin Dashboard", "Tổng quan quản trị")}
      subtitle={L(
        `${activeUserCount} active users · ${auditItems.length} audit events logged recently.`,
        `${activeUserCount} người dùng hoạt động · ${auditItems.length} sự kiện kiểm toán gần đây.`,
      )}
      kpis={(dashboard.data?.kpis ?? []).map((kpi, index) => (
        <DashboardKpiCard key={kpi.id} kpi={kpi} index={index} />
      ))}
    >
      <div className="md:col-span-1">
        <DashboardChartCard title={L("User Activity by Role", "Người dùng theo vai trò")} delay={0.1}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userActivity}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title={L("Audit Log Events", "Sự kiện nhật ký kiểm toán")} delay={0.15}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={auditEvents}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title={L("AI Usage (Queries)", "Lượt dùng AI (truy vấn)")} delay={0.2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aiUsage}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="queries"
                  fill={CHART_COLORS[4]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardActivityFeed
          items={securityEvents}
          title={L("Security Events", "Sự kiện bảo mật")}
          delay={0.25}
        />
      </div>

      <div className="md:col-span-2">
        <DashboardAdminStats
          auditLogs={auditItems}
          aiConfig={aiConfig.data ?? null}
          delay={0.3}
        />
      </div>
    </DashboardLayout>
  );
}
