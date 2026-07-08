import { http } from "msw";
import {
  format,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { getDb } from "@/mocks/db";
import { isOverdueDueDate } from "@/lib/due-date";
import { getDelay, jsonResponse, parseQuery } from "./utils";
import type { EWSReport, ReportKPI } from "@/types";

export async function handleGetEWSReport({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  let items = [...db.nccs];

  // Optional date range filter (by createdAt)
  if (q.from || q.to) {
    const from = q.from ? parseISO(q.from) : subMonths(new Date(), 12);
    const to = q.to ? parseISO(q.to) : new Date();
    items = items.filter((ncc) => {
      try {
        return isWithinInterval(parseISO(ncc.createdAt), {
          start: from,
          end: to,
        });
      } catch {
        return false;
      }
    });
  }

  const total = items.length;
  const open = items.filter((n) => n.status === "Open").length;
  const closed = items.filter((n) => n.status === "Closed").length;
  const overdue = items.filter(
    (n) => n.status === "Open" && isOverdueDueDate(n.dueDate, false),
  ).length;
  const overdueRate = open ? Math.round((overdue / open) * 1000) / 10 : 0;

  // KPIs
  const kpis: ReportKPI[] = [
    { label: "Total Cases", value: total },
    { label: "Open Cases", value: open },
    { label: "Closed Cases", value: closed },
    {
      label: "Overdue Cases",
      value: overdue,
      trend: overdue > 0 ? "up" : "flat",
      trendPercent: overdueRate,
    },
    {
      label: "Overdue Rate",
      value: `${overdueRate}%`,
      trend: overdueRate > 20 ? "up" : "down",
      trendPercent: overdueRate,
    },
    {
      label: "Closure Rate",
      value: `${total ? Math.round((closed / total) * 1000) / 10 : 0}%`,
    },
  ];

  // Monthly creation + closure trend (last 12 months)
  const now = new Date();
  const months: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(monthStart);
    months.push({
      key: format(monthStart, "yyyy-MM"),
      label: format(monthStart, "MMM yy"),
      start: monthStart,
      end: monthEnd,
    });
  }

  const creationTrend = months.map((m) => {
    const newCases = items.filter((n) => {
      try {
        return isWithinInterval(parseISO(n.createdAt), {
          start: m.start,
          end: m.end,
        });
      } catch {
        return false;
      }
    }).length;
    const closedCases = items.filter((n) => {
      if (!n.closedAt) return false;
      try {
        return isWithinInterval(parseISO(n.closedAt), {
          start: m.start,
          end: m.end,
        });
      } catch {
        return false;
      }
    }).length;
    return { month: m.label, newCases, closedCases };
  });

  // By unit (group by ownerUnitId)
  const unitMap = new Map<
    string,
    {
      unitName: string;
      region?: string;
      total: number;
      open: number;
      overdue: number;
      closed: number;
    }
  >();
  items.forEach((n) => {
    const existing = unitMap.get(n.ownerUnitId) ?? {
      unitName: n.ownerUnitName,
      region: n.ownerUnitRegion,
      total: 0,
      open: 0,
      overdue: 0,
      closed: 0,
    };
    existing.total++;
    if (n.status === "Open") {
      existing.open++;
      if (isOverdueDueDate(n.dueDate, false)) existing.overdue++;
    } else {
      existing.closed++;
    }
    unitMap.set(n.ownerUnitId, existing);
  });
  const byUnit = Array.from(unitMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  // By region (branches only)
  const regionMap = new Map<
    string,
    {
      region: string;
      total: number;
      open: number;
      overdue: number;
      closed: number;
    }
  >();
  items
    .filter((n) => n.ownerUnitType === "branch" && n.ownerUnitRegion)
    .forEach((n) => {
      const existing = regionMap.get(n.ownerUnitRegion!) ?? {
        region: n.ownerUnitRegion!,
        total: 0,
        open: 0,
        overdue: 0,
        closed: 0,
      };
      existing.total++;
      if (n.status === "Open") {
        existing.open++;
        if (isOverdueDueDate(n.dueDate, false)) existing.overdue++;
      } else {
        existing.closed++;
      }
      regionMap.set(n.ownerUnitRegion!, existing);
    });
  const byRegion = Array.from(regionMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  // By severity
  const severityMap = new Map<
    string,
    { severity: string; total: number; open: number; closed: number }
  >();
  items.forEach((n) => {
    const existing = severityMap.get(n.severity) ?? {
      severity: n.severity,
      total: 0,
      open: 0,
      closed: 0,
    };
    existing.total++;
    if (n.status === "Open") existing.open++;
    else existing.closed++;
    severityMap.set(n.severity, existing);
  });
  const severityOrder = ["critical", "high", "medium", "low"];
  const bySeverity = Array.from(severityMap.values()).sort(
    (a, b) =>
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  // Overdue trend (monthly: overdue rate among open cases as of that month end)
  const overdueTrend = months.map((m) => {
    const openAsOf = items.filter((n) => {
      try {
        return parseISO(n.createdAt) <= m.end && n.status === "Open";
      } catch {
        return false;
      }
    });
    const overdueAsOf = openAsOf.filter((n) =>
      isOverdueDueDate(n.dueDate, false),
    ).length;
    const overdueRate = openAsOf.length
      ? Math.round((overdueAsOf / openAsOf.length) * 1000) / 10
      : 0;
    return {
      month: m.label,
      overdueRate,
      overdueCount: overdueAsOf,
      openCount: openAsOf.length,
    };
  });

  // Risk alerts: units with overdue rate > 30% = high, > 15% = medium, else low
  const riskAlerts = byUnit
    .filter((u) => u.open > 0)
    .map((u) => {
      const rate = Math.round((u.overdue / u.open) * 1000) / 10;
      return {
        unitName: u.unitName,
        region: u.region,
        overdueCount: u.overdue,
        overdueRate: rate,
        totalOpen: u.open,
        severity: (rate > 30 ? "high" : rate > 15 ? "medium" : "low") as
          "high" | "medium" | "low",
      };
    })
    .filter((a) => a.severity !== "low")
    .sort((a, b) => b.overdueRate - a.overdueRate);

  const report: EWSReport = {
    kpis,
    creationTrend,
    byUnit,
    byRegion,
    bySeverity,
    overdueTrend,
    riskAlerts,
    generatedAt: new Date().toISOString(),
  };

  return jsonResponse(report);
}

export const ewsHandlers = [http.get("/api/reports/ews", handleGetEWSReport)];
