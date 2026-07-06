import { apiGet } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type { DashboardKPI, DashboardWidget, ActivityFeedItem } from "@/types";

export interface DashboardData {
  role: string;
  kpis: DashboardKPI[];
  widgets: DashboardWidget[];
  activity: ActivityFeedItem[];
}

export const DashboardService = {
  get(role: string) {
    return apiGet<DashboardData>(API_ENDPOINTS.DASHBOARD(role));
  },
};
