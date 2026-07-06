import type { BaseEntity } from "./base";

export interface DashboardKPI {
  id: string;
  title: string;
  value: number | string;
  previousPeriod?: number | string;
  trend?: "up" | "down" | "flat";
  trendPercent?: number;
  icon?: string;
  action?: () => void;
}

export interface DashboardWidget {
  id: string;
  type:
    | "kpi"
    | "chart"
    | "calendar"
    | "list"
    | "heatmap"
    | "ai_insight"
    | "activity";
  title: string;
  position: { x: number; y: number; w: number; h: number };
  data: unknown;
}

export interface TrendData {
  labels: string[];
  values: number[];
  previousValues?: number[];
}

export interface RiskHeatmapData {
  rows: string[];
  cols: string[];
  cells: {
    row: string;
    col: string;
    value: number;
    status: "low" | "medium" | "high" | "critical";
  }[];
}

export interface ActivityFeedItem extends BaseEntity {
  type:
    | "submission"
    | "approval"
    | "rejection"
    | "upload"
    | "cap_created"
    | "license_updated"
    | "regulation_published"
    | "comment"
    | "ai_insight";
  title: string;
  description: string;
  userId: string;
  userName: string;
  entityType: "compliance" | "cap" | "regulation" | "report" | "user";
  entityId: string;
  timestamp: string;
}

export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  description: string;
  type: "approval" | "compliance" | "cap" | "ai" | "system";
  read: boolean;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}
