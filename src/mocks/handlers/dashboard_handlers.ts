import { http } from "msw";
import { getDb } from "@/mocks/db";
import { isOverdueDueDate } from "@/lib/due-date";
import {
  getDelay,
  jsonResponse,
  notFound,
  type MockResolverContext,
} from "./utils";
import type {
  DashboardKPI,
  DashboardWidget,
  ActivityFeedItem,
  TrendData,
} from "@/types";

function buildKpis(role: string, db: ReturnType<typeof getDb>): DashboardKPI[] {
  const compliance = db.obligations;
  const caps = db.caps;

  const overdue = compliance.filter((i) =>
    isOverdueDueDate(i.dueDate, ["completed", "approved"].includes(i.status)),
  ).length;
  const pendingApproval = compliance.filter((i) =>
    ["review_required", "submitted"].includes(i.status),
  ).length;
  const complianceRate = compliance.length
    ? Math.round(
        (compliance.filter((i) => ["completed", "approved"].includes(i.status))
          .length /
          compliance.length) *
          1000,
      ) / 10
    : 0;
  const openCaps = caps.filter((i) => i.status !== "Closed").length;

  const common: DashboardKPI[] = [
    {
      id: "compliance-rate",
      title: "Compliance Rate",
      value: `${complianceRate}%`,
      previousPeriod: "93.8%",
      trend: "up",
      trendPercent: 1.2,
    },
    {
      id: "overdue",
      title: "Overdue",
      value: overdue,
      previousPeriod: overdue - 3,
      trend: "up",
      trendPercent: 8,
    },
    {
      id: "pending-approval",
      title: "Pending Approval",
      value: pendingApproval,
      previousPeriod: pendingApproval - 2,
      trend: "flat",
      trendPercent: 0,
    },
    {
      id: "open-caps",
      title: "Open CAPs",
      value: openCaps,
      previousPeriod: openCaps - 1,
      trend: "down",
      trendPercent: 3,
    },
  ];

  switch (role) {
    case "executive":
      return [
        {
          id: "enterprise-score",
          title: "Enterprise Score",
          value: `${complianceRate}%`,
          previousPeriod: "93%",
          trend: "up",
          trendPercent: 3,
        },
        {
          id: "top-risks",
          title: "Top Risks",
          value: compliance.filter(
            (i) =>
              i.riskLevel === "critical" &&
              isOverdueDueDate(
                i.dueDate,
                ["completed", "approved"].includes(i.status),
              ),
          ).length,
          previousPeriod: 5,
          trend: "down",
          trendPercent: 10,
        },
        {
          id: "open-caps",
          title: "Open CAPs",
          value: openCaps,
          previousPeriod: openCaps + 2,
          trend: "down",
          trendPercent: 6,
        },
        ...common.slice(0, 2),
      ];
    case "owner":
      return [
        {
          id: "todays-tasks",
          title: "Today's Tasks",
          value: compliance.filter((i) => i.status === "submitted").length,
        },
        { id: "overdue", title: "Overdue", value: overdue },
        {
          id: "pending-approval",
          title: "Pending Approval",
          value: pendingApproval,
        },
        {
          id: "my-caps",
          title: "My CAPs",
          value: caps.filter((i) => i.status !== "Closed").length,
        },
      ];
    case "approver":
      return [
        {
          id: "pending-approval",
          title: "Pending Approval",
          value: pendingApproval,
        },
        {
          id: "high-risk",
          title: "High Risk Cases",
          value: compliance.filter(
            (i) =>
              i.riskLevel === "critical" &&
              ["review_required", "submitted"].includes(i.status),
          ).length,
        },
        {
          id: "returned",
          title: "Returned Items",
          value: compliance.filter((i) => i.status === "returned").length,
        },
        {
          id: "pending-cap",
          title: "Pending CAP",
          value: caps.filter((i) => i.status === "Pending Approval").length,
        },
      ];
    case "reviewer":
      return [
        {
          id: "compliance-trends",
          title: "Compliance Trends",
          value: `${complianceRate}%`,
        },
        { id: "overdue-stats", title: "Overdue Stats", value: overdue },
        {
          id: "audit-findings",
          title: "Audit Findings",
          value: db.auditLogs.filter((l) => l.module === "compliance").length,
        },
      ];
    case "admin":
      return [
        { id: "total-users", title: "Total Users", value: db.users.length },
        {
          id: "active-users",
          title: "Active Users",
          value: db.users.filter((u) => u.isActive).length,
        },
        {
          id: "audit-events",
          title: "Audit Events",
          value: db.auditLogs.length,
        },
      ];
    default:
      return common;
  }
}

function buildWidgets(
  role: string,
  db: ReturnType<typeof getDb>,
): DashboardWidget[] {
  const trend: TrendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    values: [88, 90, 91, 89, 93, 94],
  };

  return [
    {
      id: "compliance-trend",
      type: "chart",
      title: "Compliance Trend",
      position: { x: 0, y: 0, w: 6, h: 4 },
      data: trend,
    },
    {
      id: "calendar",
      type: "calendar",
      title: "Upcoming Dates",
      position: { x: 6, y: 0, w: 6, h: 4 },
      data: [],
    },
    {
      id: "ai-insights",
      type: "ai_insight",
      title: "AI Insights",
      position: { x: 0, y: 4, w: 6, h: 4 },
      data: [],
    },
    {
      id: "activity",
      type: "activity",
      title: "Recent Activity",
      position: { x: 6, y: 4, w: 6, h: 4 },
      data: db.auditLogs.slice(0, 10),
    },
  ];
}

function buildActivity(db: ReturnType<typeof getDb>): ActivityFeedItem[] {
  return db.auditLogs.slice(0, 10).map((log) => ({
    id: log.id,
    type: log.action === "login" ? "submission" : "comment",
    title: `${log.action} in ${log.module}`,
    description: log.details ?? "",
    userId: log.userId,
    userName: log.userName,
    entityType: "compliance",
    entityId: log.object,
    timestamp: log.timestamp,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  }));
}

export async function handleDashboard({ params }: MockResolverContext) {
  await getDelay();
  const role = (params.role as string).toLowerCase();
  const validRoles = ["admin", "executive", "owner", "approver", "reviewer"];
  if (!validRoles.includes(role)) return notFound("Dashboard role not found");

  const db = getDb();
  return jsonResponse({
    role,
    kpis: buildKpis(role, db),
    widgets: buildWidgets(role, db),
    activity: buildActivity(db),
  });
}

export const dashboardHandlers = [
  http.get("/api/dashboard/:role", handleDashboard),
];
