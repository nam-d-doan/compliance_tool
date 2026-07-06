import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  Evidence,
  EvidenceFilter,
  EvidenceComment,
  Paginated,
  ActivityFeedItem,
} from "@/types";

function buildQuery(
  filters: EvidenceFilter & { page?: number; pageSize?: number },
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

export const EvidenceService = {
  list(filters: EvidenceFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<Evidence>>(
      `${API_ENDPOINTS.EVIDENCE_LIST}${buildQuery(filters)}`,
    );
  },

  get(id: string) {
    return apiGet<Evidence>(API_ENDPOINTS.EVIDENCE_GET(id));
  },

  create(data: Partial<Evidence>) {
    return apiPost<Evidence>(API_ENDPOINTS.EVIDENCE_CREATE, data);
  },

  update(id: string, data: Partial<Evidence>) {
    return apiPut<Evidence>(API_ENDPOINTS.EVIDENCE_UPDATE(id), data);
  },

  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.EVIDENCE_DELETE(id));
  },

  comments(id: string, page = 1, pageSize = 20) {
    return apiGet<Paginated<EvidenceComment>>(
      `${API_ENDPOINTS.EVIDENCE_COMMENTS(id)}?page=${page}&pageSize=${pageSize}`,
    );
  },

  addComment(id: string, content: string, userId?: string, userName?: string) {
    return apiPost<EvidenceComment>(API_ENDPOINTS.EVIDENCE_COMMENTS(id), {
      content,
      userId,
      userName,
    });
  },

  timeline(id: string) {
    return apiGet<ActivityFeedItem[]>(API_ENDPOINTS.EVIDENCE_TIMELINE(id));
  },
};
