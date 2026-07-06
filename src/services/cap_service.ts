import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  CAP,
  CAPFilter,
  CAPComment,
  CAPTimelineEvent,
  Paginated,
} from "@/types";

function buildQuery(
  filters: CAPFilter & { page?: number; pageSize?: number },
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

export const CAPService = {
  list(filters: CAPFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<CAP>>(
      `${API_ENDPOINTS.CAP_LIST}${buildQuery(filters)}`,
    );
  },

  get(id: string) {
    return apiGet<CAP>(API_ENDPOINTS.CAP_GET(id));
  },

  create(data: Partial<CAP>) {
    return apiPost<CAP>(API_ENDPOINTS.CAP_CREATE, data);
  },

  update(id: string, data: Partial<CAP>) {
    return apiPut<CAP>(API_ENDPOINTS.CAP_UPDATE(id), data);
  },

  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.CAP_DELETE(id));
  },

  timeline(id: string) {
    return apiGet<CAPTimelineEvent[]>(API_ENDPOINTS.CAP_TIMELINE(id));
  },

  comments(id: string, page = 1, pageSize = 20) {
    return apiGet<Paginated<CAPComment>>(
      `${API_ENDPOINTS.CAP_COMMENTS(id)}?page=${page}&pageSize=${pageSize}`,
    );
  },

  addComment(id: string, content: string, userId?: string, userName?: string) {
    return apiPost<CAPComment>(API_ENDPOINTS.CAP_COMMENTS(id), {
      content,
      userId,
      userName,
    });
  },
};
