import type { BaseEntity } from "./base";
import type { DateRange } from "./base";
import type { PriorityLevel } from "@/constants/status";
import type { RiskHeatmapData } from "./dashboard";

export interface ReportKPI {
  label: string;
  value: number | string;
  previousPeriod?: number | string;
  trend?: "up" | "down" | "flat";
  trendPercent?: number;
  icon?: string;
}

export interface ReportChart {
  id: string;
  type: "bar" | "line" | "pie" | "area" | "stacked-bar" | "donut";
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface Report extends BaseEntity {
  type: ReportType;
  title: string;
  filters: ReportFilter;
  kpis: ReportKPI[];
  charts: ReportChart[];
  tableData: Record<string, unknown>[];
  summary: string;
  aiInsights: string[];
  exportedAt?: string;
  heatmapData?: RiskHeatmapData;
}

export type ReportType =
  | "status"
  | "calendar"
  | "checklist"
  | "aging"
  | "cap"
  | "regulatory"
  | "department"
  | "executive"
  | "risk"
  | "user-activity"
  | "audit-trail";

export interface ReportFilter {
  dateRange?: DateRange;
  department?: string | string[];
  businessUnit?: string | string[];
  location?: string | string[];
  owner?: string;
  approver?: string;
  complianceCategory?: string;
  status?: string | string[];
  criticality?: PriorityLevel | PriorityLevel[];
  riskLevel?: PriorityLevel | PriorityLevel[];
  regulation?: string;
  capStatus?: string | string[];
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export interface ExecutiveSummary {
  enterpriseHealth: {
    score: number;
    trend: "up" | "down" | "flat";
    trendPercent: number;
  };
  topRisks: {
    title: string;
    severity: PriorityLevel;
    owner: string;
    dueDate: string;
  }[];
  criticalCompliance: {
    id: string;
    title: string;
    status: string;
    dueDate: string;
  }[];
  capOverview: {
    open: number;
    completed: number;
    overdue: number;
    averageResolutionDays: number;
  };
  regulatoryChanges: {
    id: string;
    title: string;
    effectiveDate: string;
    impactScore: number;
  }[];
  departmentRanking: {
    department: string;
    complianceRate: number;
    overdueCount: number;
    capCount: number;
  }[];
  aiSummary: string;
  recommendedActions: string[];
}

/** Early Warning System report — trending analysis of non-compliance metrics. */
export interface EWSReport {
  /** KPI cards at the top of the report. */
  kpis: ReportKPI[];
  /** Monthly trend: new cases opened per month. */
  creationTrend: { month: string; newCases: number; closedCases: number }[];
  /** NCC count by owner unit (top N by volume). */
  byUnit: {
    unitName: string;
    region?: string;
    total: number;
    open: number;
    overdue: number;
    closed: number;
  }[];
  /** NCC count by region (branches only; HO departments have no region). */
  byRegion: {
    region: string;
    total: number;
    open: number;
    overdue: number;
    closed: number;
  }[];
  /** NCC count by severity. */
  bySeverity: {
    severity: string;
    total: number;
    open: number;
    closed: number;
  }[];
  /** Overdue rate trend: % of open cases that are overdue, per month. */
  overdueTrend: {
    month: string;
    overdueRate: number;
    overdueCount: number;
    openCount: number;
  }[];
  /** Units flagged as high-risk (overdue rate > threshold or rising trend). */
  riskAlerts: {
    unitName: string;
    region?: string;
    overdueCount: number;
    overdueRate: number;
    totalOpen: number;
    severity: "high" | "medium" | "low";
  }[];
  /** Generated-at timestamp. */
  generatedAt: string;
}
