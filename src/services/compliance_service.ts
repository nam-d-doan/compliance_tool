import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  ComplianceObligation,
  ComplianceFilter,
  ComplianceComment,
  ComplianceTimelineEvent,
  Paginated,
} from "@/types";

function buildQuery(
  filters: ComplianceFilter & {
    page?: number;
    pageSize?: number;
    sortField?: string;
    sortDirection?: string;
  },
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

export const ComplianceService = {
  list(
    filters: ComplianceFilter & {
      page?: number;
      pageSize?: number;
      sortField?: string;
      sortDirection?: string;
    } = {},
  ) {
    return apiGet<Paginated<ComplianceObligation>>(
      `${API_ENDPOINTS.COMPLIANCE_LIST}${buildQuery(filters)}`,
    );
  },

  get(id: string) {
    return apiGet<ComplianceObligation>(API_ENDPOINTS.COMPLIANCE_GET(id));
  },

  create(data: Partial<ComplianceObligation>) {
    return apiPost<ComplianceObligation>(API_ENDPOINTS.COMPLIANCE_CREATE, data);
  },

  update(id: string, data: Partial<ComplianceObligation>) {
    return apiPut<ComplianceObligation>(
      API_ENDPOINTS.COMPLIANCE_UPDATE(id),
      data,
    );
  },

  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.COMPLIANCE_DELETE(id));
  },

  timeline(id: string) {
    return apiGet<ComplianceTimelineEvent[]>(
      API_ENDPOINTS.COMPLIANCE_TIMELINE(id),
    );
  },

  comments(id: string, page = 1, pageSize = 20) {
    return apiGet<Paginated<ComplianceComment>>(
      `${API_ENDPOINTS.COMPLIANCE_COMMENTS(id)}?page=${page}&pageSize=${pageSize}`,
    );
  },

  addComment(id: string, content: string, userId?: string, userName?: string) {
    return apiPost<ComplianceComment>(API_ENDPOINTS.COMPLIANCE_COMMENTS(id), {
      content,
      userId,
      userName,
    });
  },
};
