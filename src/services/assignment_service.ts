import { apiGet, apiPost, apiPut } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  BulkAssignmentInput,
  AssignmentFilter,
  AssignmentTimelineEvent,
  Paginated,
} from "@/types";

function buildQuery(
  filters: AssignmentFilter & { page?: number; pageSize?: number },
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

export const AssignmentService = {
  list(filters: AssignmentFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<Assignment>>(
      `${API_ENDPOINTS.ASSIGNMENT_LIST}${buildQuery(filters)}`,
    );
  },

  get(id: string) {
    return apiGet<Assignment>(API_ENDPOINTS.ASSIGNMENT_GET(id));
  },

  create(data: CreateAssignmentInput) {
    return apiPost<Assignment>(API_ENDPOINTS.ASSIGNMENT_CREATE, data);
  },

  update(id: string, data: UpdateAssignmentInput) {
    return apiPut<Assignment>(API_ENDPOINTS.ASSIGNMENT_UPDATE(id), data);
  },

  acknowledge(id: string) {
    return apiPost<Assignment>(API_ENDPOINTS.ASSIGNMENT_ACKNOWLEDGE(id), {});
  },

  cancel(id: string) {
    return apiPost<Assignment>(API_ENDPOINTS.ASSIGNMENT_CANCEL(id), {});
  },

  bulk(data: BulkAssignmentInput) {
    return apiPost<{ success: boolean; updated: number; items: Assignment[] }>(
      API_ENDPOINTS.ASSIGNMENT_BULK,
      data,
    );
  },

  timeline(id: string) {
    return apiGet<AssignmentTimelineEvent[]>(
      API_ENDPOINTS.ASSIGNMENT_TIMELINE(id),
    );
  },
};
