import { apiGet } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type { EWSReport } from "@/types";

export const EWSService = {
  report(filters: { from?: string; to?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiGet<EWSReport>(`${API_ENDPOINTS.EWS_REPORT}${query}`);
  },
};
