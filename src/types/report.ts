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
  | "license"
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
  reviewer?: string;
  complianceCategory?: string;
  status?: string | string[];
  criticality?: PriorityLevel | PriorityLevel[];
  riskLevel?: PriorityLevel | PriorityLevel[];
  regulation?: string;
  licenseCategory?: string;
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
  licenseStatus: {
    active: number;
    expired: number;
    expiringSoon: number;
    renewed: number;
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
