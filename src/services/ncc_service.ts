import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  NonComplianceCase,
  NCCFilter,
  CreateNCCInput,
  UpdateNCCInput,
  Paginated,
} from "@/types";

function buildQuery(
  filters: NCCFilter & { page?: number; pageSize?: number },
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

export const NCCService = {
  list(filters: NCCFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<NonComplianceCase>>(
      `${API_ENDPOINTS.NCC_LIST}${buildQuery(filters)}`,
    );
  },

  get(id: string) {
    return apiGet<NonComplianceCase>(API_ENDPOINTS.NCC_GET(id));
  },

  create(data: CreateNCCInput) {
    return apiPost<NonComplianceCase>(API_ENDPOINTS.NCC_CREATE, data);
  },

  update(id: string, data: UpdateNCCInput) {
    return apiPut<NonComplianceCase>(API_ENDPOINTS.NCC_UPDATE(id), data);
  },

  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.NCC_DELETE(id));
  },
};
