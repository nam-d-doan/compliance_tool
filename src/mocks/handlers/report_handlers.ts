import { http } from "msw";
import { format, addDays } from "date-fns";
import { getDb } from "@/mocks/db";
import { isOverdueDueDate } from "@/lib/due-date";
import {
  getDelay,
  jsonResponse,
  badRequest,
  parseQuery,
  parseNumber,
  type MockResolverContext,
} from "./utils";
import type {
  Report,
  ExecutiveSummary,
  ReportKPI,
  ReportChart,
  RiskHeatmapData,
} from "@/types";

const today = new Date();

function statusReport(db: ReturnType<typeof getDb>): Report {
  const items = db.compliance;
  const total = items.length;
  const completed = items.filter((i) =>
    ["Completed", "Approved"].includes(i.status),
  ).length;
  const submitted = items.filter((i) => i.status === "Submitted").length;
  const approved = items.filter((i) => i.status === "Approved").length;
  const overdue = items.filter((i) =>
    isOverdueDueDate(i.dueDate, ["Completed", "Approved"].includes(i.status)),
  ).length;
  const rejected = items.filter((i) => i.status === "Rejected").length;
  const complianceRate = total
    ? Math.round((completed / total) * 1000) / 10
    : 0;

  const kpis: ReportKPI[] = [
    {
      label: "Overall Compliance Rate",
      value: `${complianceRate}%`,
      trend: "up",
      trendPercent: 2.4,
    },
    { label: "Items Submitted", value: submitted },
    { label: "Items Approved", value: approved },
    { label: "Items Rejected", value: rejected },
    {
      label: "Overdue Items",
      value: overdue,
      trend: "down",
      trendPercent: 5.1,
    },
  ];

  const byStatus: Record<string, number> = {};
  items.forEach((i) => {
    byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
  });

  const departments = [...new Set(items.map((i) => i.department))].slice(0, 8);
  const businessUnits = [...new Set(items.map((i) => i.businessUnit))].slice(
    0,
    8,
  );

  const trendLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const trendBase = complianceRate;
  const trendValues = trendLabels.map((_, i) => {
    const variance = Math.sin(i * 0.8) * 2.5;
    return Math.max(
      80,
      Math.min(99, Math.round((trendBase + variance) * 10) / 10),
    );
  });

  const charts: ReportChart[] = [
    {
      id: "compliance-trend",
      type: "area",
      title: "Compliance Trend",
      labels: trendLabels,
      datasets: [
        { label: "Compliance Rate %", data: trendValues, color: "#3b82f6" },
      ],
    },
    {
      id: "status-distribution",
      type: "pie",
      title: "Status Breakdown",
      labels: Object.keys(byStatus),
      datasets: [{ label: "Obligations", data: Object.values(byStatus) }],
    },
    {
      id: "by-business-unit",
      type: "bar",
      title: "By Business Unit",
      labels: businessUnits,
      datasets: [
        {
          label: "Total",
          data: businessUnits.map(
            (bu) => items.filter((i) => i.businessUnit === bu).length,
          ),
          color: "#3b82f6",
        },
        {
          label: "Completed",
          data: businessUnits.map(
            (bu) =>
              items.filter(
                (i) =>
                  i.businessUnit === bu &&
                  ["Completed", "Approved"].includes(i.status),
              ).length,
          ),
          color: "#10b981",
        },
      ],
    },
    {
      id: "by-department",
      type: "bar",
      title: "By Department",
      labels: departments,
      datasets: [
        {
          label: "Overdue",
          data: departments.map(
            (d) =>
              items.filter(
                (i) =>
                  i.department === d &&
                  isOverdueDueDate(
                    i.dueDate,
                    ["Completed", "Approved"].includes(i.status),
                  ),
              ).length,
          ),
          color: "#ef4444",
        },
      ],
    },
  ];

  const outcome = (status: string) => {
    if (["Completed", "Approved"].includes(status)) return "Compliant";
    if (status === "Rejected") return "Non-compliant";
    return "In Progress";
  };

  return {
    id: `report-status`,
    type: "status",
    title: "Compliance Status Report",
    filters: {},
    kpis,
    charts,
    tableData: items.slice(0, 20).map((i) => ({
      id: i.complianceId,
      title: i.title,
      owner: i.ownerName,
      status: i.status,
      dueDate: i.dueDate,
      outcome: outcome(i.status),
      riskScore: i.aiRiskScore,
      businessUnit: i.businessUnit,
      department: i.department,
      regulation: i.regulationName,
    })),
    summary: `Overall compliance rate is ${complianceRate}% with ${overdue} overdue obligations requiring attention.`,
    aiInsights: [
      "Treasury and Operations have the highest overdue rate.",
      "AI predicts 12 likely overdue submissions next week.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface CalendarEventRow {
  id: string;
  title: string;
  date: string;
  type: "compliance" | "cap";
  status: string;
  entityId: string;
  owner?: string;
}

function calendarReport(db: ReturnType<typeof getDb>): Report {
  const complianceEvents: CalendarEventRow[] = db.compliance
    .filter((i) => i.dueDate)
    .map((i) => ({
      id: `evt-cmp-${i.id}`,
      title: i.title,
      date: i.dueDate,
      type: "compliance",
      status: i.status,
      entityId: i.complianceId,
      owner: i.ownerName,
    }));

  const capEvents: CalendarEventRow[] = db.caps
    .filter((i) => i.dueDate)
    .map((i) => ({
      id: `evt-cap-${i.id}`,
      title: i.title,
      date: i.dueDate,
      type: "cap",
      status: i.status,
      entityId: i.capId,
      owner: i.ownerName,
    }));

  const events = [...complianceEvents, ...capEvents];

  return {
    id: "report-calendar",
    type: "calendar",
    title: "Compliance Calendar Report",
    filters: {},
    kpis: [
      { label: "Compliance Due", value: complianceEvents.length },
      { label: "CAP Deadlines", value: capEvents.length },
      {
        label: "Next 30 Days",
        value: events.filter((e) => {
          const days = Math.floor(
            (new Date(e.date).getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return days >= 0 && days <= 30;
        }).length,
      },
    ],
    charts: [],
    tableData: events as unknown as Record<string, unknown>[],
    summary: `Calendar shows ${events.length} upcoming events including ${capEvents.length} CAP deadlines.`,
    aiInsights: [
      "5 CAP deadlines fall within the same week as regulatory submissions.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function capReport(db: ReturnType<typeof getDb>): Report {
  const items = db.caps;
  const total = items.length;
  const open = items.filter((i) => i.status !== "Closed").length;
  const closed = items.filter((i) => i.status === "Closed").length;
  const overdue = items.filter((i) =>
    isOverdueDueDate(i.dueDate, i.status === "Closed"),
  ).length;
  const avgDays = items.length
    ? Math.round(
        items.reduce((sum, i) => sum + (i.status === "Closed" ? 45 : 0), 0) /
          items.length,
      )
    : 0;
  const avgCost = items.length
    ? Math.round(
        items.reduce((sum, i) => sum + (i.actualCost || 0), 0) / items.length,
      )
    : 0;

  const kpis: ReportKPI[] = [
    { label: "Total CAPs", value: total },
    { label: "Open", value: open },
    { label: "Closed", value: closed },
    { label: "Overdue", value: overdue },
    { label: "Avg Time to Close", value: `${avgDays} days` },
    { label: "Avg Cost", value: `$${avgCost.toLocaleString()}` },
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const createdByMonth = months.map(
    (_, i) =>
      items.filter((c) => {
        const created = new Date(c.createdAt);
        return created.getMonth() === i % 12;
      }).length,
  );
  const closedByMonth = months.map(
    (_, i) =>
      items.filter((c) => {
        const updated = new Date(c.updatedAt);
        return c.status === "Closed" && updated.getMonth() === i % 12;
      }).length,
  );

  const byStatus: Record<string, number> = {};
  items.forEach((i) => {
    byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
  });

  const byPriority: Record<string, number> = {};
  items.forEach((i) => {
    byPriority[i.priority] = (byPriority[i.priority] ?? 0) + 1;
  });

  const departments = [...new Set(items.map((i) => i.department))].slice(0, 8);

  const charts: ReportChart[] = [
    {
      id: "caps-over-time",
      type: "line",
      title: "CAPs Over Time",
      labels: months,
      datasets: [
        { label: "Created", data: createdByMonth, color: "#3b82f6" },
        { label: "Closed", data: closedByMonth, color: "#10b981" },
      ],
    },
    {
      id: "cap-status",
      type: "pie",
      title: "By Status",
      labels: Object.keys(byStatus),
      datasets: [{ label: "CAPs", data: Object.values(byStatus) }],
    },
    {
      id: "cap-priority",
      type: "bar",
      title: "By Priority",
      labels: Object.keys(byPriority),
      datasets: [
        { label: "CAPs", data: Object.values(byPriority), color: "#f59e0b" },
      ],
    },
    {
      id: "cap-department",
      type: "bar",
      title: "By Department",
      labels: departments,
      datasets: [
        {
          label: "Open",
          data: departments.map(
            (d) =>
              items.filter((i) => i.department === d && i.status !== "Closed")
                .length,
          ),
          color: "#3b82f6",
        },
        {
          label: "Overdue",
          data: departments.map(
            (d) =>
              items.filter(
                (i) =>
                  i.department === d &&
                  isOverdueDueDate(i.dueDate, i.status === "Closed"),
              ).length,
          ),
          color: "#ef4444",
        },
      ],
    },
    {
      id: "cap-cost",
      type: "bar",
      title: "Cost Breakdown",
      labels: departments,
      datasets: [
        {
          label: "Estimated Cost ($)",
          data: departments.map((d) =>
            items
              .filter((i) => i.department === d)
              .reduce((sum, i) => sum + i.estimatedCost, 0),
          ),
          color: "#8b5cf6",
        },
      ],
    },
  ];

  return {
    id: "report-cap",
    type: "cap",
    title: "Corrective Action Plan Report",
    filters: {},
    kpis,
    charts,
    tableData: items.slice(0, 20).map((i) => ({
      id: i.capId,
      title: i.title,
      priority: i.priority,
      status: i.status,
      owner: i.ownerName,
      due: i.dueDate,
      cost: i.estimatedCost,
      progress: i.progress,
    })) as unknown as Record<string, unknown>[],
    summary: `${open} CAPs remain open with ${overdue} overdue.`,
    aiInsights: [
      "High priority CAPs in Retail Banking are at risk of missing deadlines.",
      "Average closure time is 14% above target — consider additional reviewer capacity.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function executiveReport(
  db: ReturnType<typeof getDb>,
): Report & { data: ExecutiveSummary } {
  const compliance = db.compliance;
  const caps = db.caps;
  const total = compliance.length;
  const completed = compliance.filter((i) =>
    ["Completed", "Approved"].includes(i.status),
  ).length;
  const complianceRate = total
    ? Math.round((completed / total) * 1000) / 10
    : 0;
  const overdue = compliance.filter((i) =>
    isOverdueDueDate(i.dueDate, ["Completed", "Approved"].includes(i.status)),
  ).length;
  const riskScore = Math.round(
    compliance.reduce((sum, i) => sum + i.aiRiskScore, 0) / (total || 1),
  );

  const summary: ExecutiveSummary = {
    enterpriseHealth: { score: complianceRate, trend: "up", trendPercent: 3.2 },
    topRisks: compliance
      .filter(
        (i) =>
          i.criticality === "critical" &&
          isOverdueDueDate(
            i.dueDate,
            ["Completed", "Approved"].includes(i.status),
          ),
      )
      .slice(0, 5)
      .map((i) => ({
        title: i.title,
        severity: i.criticality,
        owner: i.ownerName,
        dueDate: i.dueDate,
      })),
    criticalCompliance: compliance
      .filter((i) => i.criticality === "critical")
      .slice(0, 5)
      .map((i) => ({
        id: i.complianceId,
        title: i.title,
        status: i.status,
        dueDate: i.dueDate,
      })),
    capOverview: {
      open: caps.filter((i) => i.status !== "Closed").length,
      completed: caps.filter((i) => i.status === "Closed").length,
      overdue: caps.filter((i) =>
        isOverdueDueDate(i.dueDate, i.status === "Closed"),
      ).length,
      averageResolutionDays: caps.length ? 42 : 0,
    },
    regulatoryChanges: db.regulations.slice(0, 5).map((r) => ({
      id: r.id,
      title: r.title,
      effectiveDate: r.effectiveDate,
      impactScore:
        r.priority === "critical" ? 95 : r.priority === "high" ? 75 : 50,
    })),
    departmentRanking: [...new Set(compliance.map((i) => i.department))]
      .slice(0, 5)
      .map((d) => {
        const deptItems = compliance.filter((i) => i.department === d);
        const completedDept = deptItems.filter((i) =>
          ["Completed", "Approved"].includes(i.status),
        ).length;
        return {
          department: d,
          complianceRate: deptItems.length
            ? Math.round((completedDept / deptItems.length) * 1000) / 10
            : 0,
          overdueCount: deptItems.filter((i) =>
            isOverdueDueDate(
              i.dueDate,
              ["Completed", "Approved"].includes(i.status),
            ),
          ).length,
          capCount: caps.filter((i) => i.department === d).length,
        };
      }),
    aiSummary:
      "Overall compliance improved 3% this month. However, Treasury and Operations continue to show the highest overdue rates. AI recommends reviewing workload allocation and escalating 5 critical items.",
    recommendedActions: [
      "Review workload allocation in Treasury — owner capacity is below target.",
      "Escalate 5 overdue critical obligations to the regional risk committee.",
      "Add reviewer capacity to Retail Banking CAPs to reduce closure time.",
    ],
  };

  const trendLabels = [
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
  ];
  const trendValues = [
    91,
    92,
    91,
    93,
    94,
    95,
    94,
    95,
    96,
    95,
    96,
    complianceRate,
  ];

  const buData = summary.departmentRanking.map((d) => ({
    name: d.department,
    value: d.complianceRate,
  }));

  const capStatus: Record<string, number> = {};
  caps.forEach((i) => {
    capStatus[i.status] = (capStatus[i.status] ?? 0) + 1;
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const heatmapData = {
    rows: summary.departmentRanking.map((d) => d.department),
    cols: months,
    cells: summary.departmentRanking.flatMap((d) =>
      months.map((m, i) => ({
        row: d.department,
        col: m,
        value: Math.min(
          1,
          Math.max(0, d.complianceRate / 100 - i * 0.02 + Math.random() * 0.05),
        ),
        status:
          d.complianceRate > 90
            ? "low"
            : d.complianceRate > 75
              ? "medium"
              : d.complianceRate > 60
                ? "high"
                : "critical",
      })),
    ),
  };

  return {
    id: "report-executive",
    type: "executive",
    title: "Executive Summary Report",
    filters: {},
    data: summary,
    heatmapData: heatmapData as unknown as RiskHeatmapData,
    kpis: [
      {
        label: "Overall Compliance Rate",
        value: `${complianceRate}%`,
        trend: "up",
        trendPercent: 3.2,
      },
      { label: "Risk Score", value: riskScore },
      { label: "Open CAPs", value: summary.capOverview.open },
      {
        label: "Overdue Items",
        value: overdue,
        trend: "down",
        trendPercent: 2.1,
      },
      {
        label: "Compliance Trend",
        value: `${trendValues[trendValues.length - 2]}% → ${complianceRate}%`,
        trend: "up",
        trendPercent: 1.2,
      },
    ],
    charts: [
      {
        id: "compliance-trend",
        type: "area",
        title: "Compliance Trend (12 months)",
        labels: trendLabels,
        datasets: [{ label: "Rate %", data: trendValues, color: "#3b82f6" }],
      },
      {
        id: "risk-heatmap",
        type: "stacked-bar",
        title: "Risk Heatmap",
        labels: heatmapData.rows,
        datasets: [],
      },
      {
        id: "compliance-by-bu",
        type: "bar",
        title: "Compliance by Business Unit",
        labels: buData.map((d) => d.name),
        datasets: [
          {
            label: "Compliance Rate %",
            data: buData.map((d) => d.value),
            color: "#10b981",
          },
        ],
      },
      {
        id: "cap-status-pie",
        type: "pie",
        title: "CAP Status",
        labels: Object.keys(capStatus),
        datasets: [{ label: "CAPs", data: Object.values(capStatus) }],
      },
    ],
    tableData: summary.departmentRanking as unknown as Record<
      string,
      unknown
    >[],
    summary: summary.aiSummary,
    aiInsights: summary.recommendedActions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function handleGetReport({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const type = params.type as string;
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();

  let report: Report;
  switch (type) {
    case "status":
      report = statusReport(db);
      break;
    case "cap":
      report = capReport(db);
      break;
    case "executive":
      report = executiveReport(db);
      break;
    case "calendar":
      report = calendarReport(db);
      break;
    default:
      return badRequest(`Unknown report type: ${type}`);
  }

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  report.tableData = report.tableData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  return jsonResponse(report);
}

export const reportHandlers = [http.get("/api/reports/:type", handleGetReport)];
