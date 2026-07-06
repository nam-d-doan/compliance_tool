import { apiGet } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  Report,
  ReportFilter,
  ExecutiveSummary,
  ReportType,
} from "@/types";

export const ReportService = {
  get(type: ReportType, filters: ReportFilter = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (key === "dateRange" && typeof value === "object") {
        const range = value as { start?: string; end?: string };
        if (range.start) params.set("dateFrom", range.start);
        if (range.end) params.set("dateTo", range.end);
        return;
      }
      if (Array.isArray(value)) {
        if (value.length) params.set(key, value.join(","));
      } else {
        params.set(key, String(value));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiGet<Report>(`${API_ENDPOINTS.REPORT_BY_TYPE(type)}${query}`);
  },

  executive(filters: ReportFilter = {}) {
    return this.get("executive", filters) as Promise<
      Report & { data?: ExecutiveSummary }
    >;
  },
};
