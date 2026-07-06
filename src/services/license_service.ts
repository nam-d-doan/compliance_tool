import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  License,
  LicenseFilter,
  LicenseCalendarEvent,
  LicenseComment,
  Paginated,
} from "@/types";

function buildQuery(
  filters: LicenseFilter & { page?: number; pageSize?: number },
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

export const LicenseService = {
  list(filters: LicenseFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<License>>(
      `${API_ENDPOINTS.LICENSE_LIST}${buildQuery(filters)}`,
    );
  },

  get(id: string) {
    return apiGet<License>(API_ENDPOINTS.LICENSE_GET(id));
  },

  create(data: Partial<License>) {
    return apiPost<License>(API_ENDPOINTS.LICENSE_CREATE, data);
  },

  update(id: string, data: Partial<License>) {
    return apiPut<License>(API_ENDPOINTS.LICENSE_UPDATE(id), data);
  },

  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.LICENSE_DELETE(id));
  },

  calendar(
    filters: {
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiGet<Paginated<LicenseCalendarEvent>>(
      `${API_ENDPOINTS.LICENSE_CALENDAR}${query}`,
    );
  },

  addComment(id: string, content: string, userId?: string, userName?: string) {
    return apiPost<LicenseComment>(API_ENDPOINTS.LICENSE_COMMENTS(id), {
      content,
      userId,
      userName,
    });
  },
};
