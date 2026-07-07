import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  Regulation,
  RegulationFilter,
  RegulationComparison,
  RegulationImpact,
  RegulationDependency,
  RegulationDependencyItem,
  VietLexDoc,
  VietLexDocDetail,
  Paginated,
  ActivityFeedItem,
} from "@/types";

interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

function buildQuery(
  filters: RegulationFilter & { page?: number; pageSize?: number },
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

export const RegulationService = {
  list(filters: RegulationFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<Regulation>>(
      `${API_ENDPOINTS.REGULATION_LIST}${buildQuery(filters)}`,
    );
  },

  get(id: string) {
    return apiGet<Regulation>(API_ENDPOINTS.REGULATION_GET(id));
  },

  create(data: Partial<Regulation>) {
    return apiPost<Regulation>(API_ENDPOINTS.REGULATION_CREATE, data);
  },

  update(id: string, data: Partial<Regulation>) {
    return apiPut<Regulation>(API_ENDPOINTS.REGULATION_UPDATE(id), data);
  },

  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.REGULATION_DELETE(id));
  },

  archive(id: string) {
    return apiPatch<Regulation>(API_ENDPOINTS.REGULATION_ARCHIVE(id), {});
  },

  bulkArchive(ids: string[]) {
    return apiPatch<{ success: boolean; archived: number }>(
      API_ENDPOINTS.REGULATIONS_BULK_ARCHIVE,
      { ids },
    );
  },

  timeline(id: string) {
    return apiGet<ActivityFeedItem[]>(API_ENDPOINTS.REGULATION_TIMELINE(id));
  },

  comments(id: string, page = 1, pageSize = 20) {
    return apiGet<Paginated<CommentItem>>(
      `${API_ENDPOINTS.REGULATION_COMMENTS(id)}?page=${page}&pageSize=${pageSize}`,
    );
  },

  addComment(id: string, content: string, userId?: string, userName?: string) {
    return apiPost<CommentItem>(API_ENDPOINTS.REGULATION_COMMENTS(id), {
      content,
      userId,
      userName,
    });
  },

  compare(a: string, b: string) {
    return apiPost<RegulationComparison>(API_ENDPOINTS.REGULATION_COMPARE, {
      a,
      b,
    });
  },

  impact(id: string) {
    return apiPost<RegulationImpact>(API_ENDPOINTS.REGULATION_IMPACT, { id });
  },

  getDependencies(regulationId: string) {
    return apiGet<RegulationDependencyItem[]>(
      API_ENDPOINTS.REGULATIONS_DEPENDENCIES(regulationId),
    );
  },

  createDependency(data: Partial<RegulationDependency>) {
    return apiPost<RegulationDependency>(
      API_ENDPOINTS.REGULATION_DEPENDENCIES,
      data,
    );
  },

  updateDependency(id: string, data: Partial<RegulationDependency>) {
    return apiPatch<RegulationDependency>(
      `${API_ENDPOINTS.REGULATION_DEPENDENCIES}/${id}`,
      data,
    );
  },

  deleteDependency(id: string) {
    return apiDelete<{ success: boolean }>(
      `${API_ENDPOINTS.REGULATION_DEPENDENCIES}/${id}`,
    );
  },

  getVietLexDocument(docNumber: string) {
    return apiGet<VietLexDocDetail>(API_ENDPOINTS.VIETLEX_DETAIL(docNumber));
  },

  searchVietLex(query: string) {
    return apiGet<VietLexDoc[]>(
      `${API_ENDPOINTS.VIETLEX_SEARCH}?q=${encodeURIComponent(query)}`,
    );
  },
};
