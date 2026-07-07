import { apiGet, apiPost, apiPatch, apiPut } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  BulkCreateObligationsInput,
  BulkCreateObligationsResult,
  BulkUpdateObligationsInput,
  BulkUpdateObligationsResult,
  Obligation,
  ObligationFilter,
  Paginated,
} from "@/types";

function buildQuery(
  filters: ObligationFilter & { page?: number; pageSize?: number },
): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  });
  return params.toString() ? `?${params.toString()}` : "";
}

export const ObligationService = {
  list(filters: ObligationFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<Obligation>>(
      `${API_ENDPOINTS.OBLIGATION_LIST}${buildQuery(filters)}`,
    );
  },

  get(id: string) {
    return apiGet<Obligation>(API_ENDPOINTS.OBLIGATION_GET(id));
  },

  update(id: string, data: Partial<Obligation>) {
    return apiPut<Obligation>(API_ENDPOINTS.OBLIGATION_UPDATE(id), data);
  },

  bulkCreate(data: BulkCreateObligationsInput) {
    return apiPost<BulkCreateObligationsResult>(
      API_ENDPOINTS.OBLIGATION_BULK,
      data,
    );
  },

  bulkUpdate(data: BulkUpdateObligationsInput) {
    return apiPatch<BulkUpdateObligationsResult>(
      API_ENDPOINTS.OBLIGATION_BULK_UPDATE,
      data,
    );
  },
};
