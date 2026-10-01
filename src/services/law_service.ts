import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  AdviceRequest,
  LawRequestFilter,
  CreateAdviceRequestInput,
  UpdateAdviceRequestInput,
  LawEvent,
  Paginated,
} from "@/types";

function buildQuery(
  filters: LawRequestFilter & { page?: number; pageSize?: number },
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

export const LawService = {
  list(filters: LawRequestFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<AdviceRequest>>(
      `${API_ENDPOINTS.LAW_REQUEST_LIST}${buildQuery(filters)}`,
    );
  },
  get(id: string) {
    return apiGet<AdviceRequest>(API_ENDPOINTS.LAW_REQUEST_GET(id));
  },
  create(data: CreateAdviceRequestInput) {
    return apiPost<AdviceRequest>(API_ENDPOINTS.LAW_REQUEST_CREATE, data);
  },
  update(id: string, data: UpdateAdviceRequestInput) {
    return apiPut<AdviceRequest>(API_ENDPOINTS.LAW_REQUEST_UPDATE(id), data);
  },
  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.LAW_REQUEST_DELETE(id));
  },
  events(id: string) {
    return apiGet<LawEvent[]>(API_ENDPOINTS.LAW_REQUEST_EVENTS(id));
  },
};
