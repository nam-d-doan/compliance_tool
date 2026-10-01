import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  LitigationCase,
  LMCaseFilter,
  CreateLMCaseInput,
  UpdateLMCaseInput,
  CaseMilestone,
  UpdateLMMilestoneInput,
  LegalDeadline,
  UpdateLMDeadlineInput,
  CaseEvent,
  AlertRule,
  LMWorkloadEntry,
  LMDashboardSummary,
  Paginated,
} from "@/types";

function buildQuery(
  filters: LMCaseFilter & { page?: number; pageSize?: number },
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

export const LMService = {
  list(filters: LMCaseFilter & { page?: number; pageSize?: number } = {}) {
    return apiGet<Paginated<LitigationCase>>(
      `${API_ENDPOINTS.LM_CASE_LIST}${buildQuery(filters)}`,
    );
  },
  get(id: string) {
    return apiGet<LitigationCase>(API_ENDPOINTS.LM_CASE_GET(id));
  },
  create(data: CreateLMCaseInput) {
    return apiPost<LitigationCase>(API_ENDPOINTS.LM_CASE_CREATE, data);
  },
  update(id: string, data: UpdateLMCaseInput) {
    return apiPut<LitigationCase>(API_ENDPOINTS.LM_CASE_UPDATE(id), data);
  },
  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.LM_CASE_DELETE(id));
  },
  milestones(id: string) {
    return apiGet<CaseMilestone[]>(API_ENDPOINTS.LM_CASE_MILESTONES(id));
  },
  deadlines(id: string) {
    return apiGet<LegalDeadline[]>(API_ENDPOINTS.LM_CASE_DEADLINES(id));
  },
  events(id: string) {
    return apiGet<CaseEvent[]>(API_ENDPOINTS.LM_CASE_EVENTS(id));
  },
  alertRules() {
    return apiGet<AlertRule[]>(API_ENDPOINTS.LM_ALERT_RULES);
  },
  updateMilestone(id: string, data: UpdateLMMilestoneInput) {
    return apiPut<CaseMilestone>(API_ENDPOINTS.LM_MILESTONE_UPDATE(id), data);
  },
  updateDeadline(id: string, data: UpdateLMDeadlineInput) {
    return apiPut<LegalDeadline>(API_ENDPOINTS.LM_DEADLINE_UPDATE(id), data);
  },
  workload() {
    return apiGet<LMWorkloadEntry[]>(API_ENDPOINTS.LM_WORKLOAD);
  },
  dashboard() {
    return apiGet<LMDashboardSummary>(API_ENDPOINTS.LM_DASHBOARD);
  },
  remind(id: string, fromUserId?: string, fromUserName?: string) {
    return apiPost<{ success: boolean }>(API_ENDPOINTS.LM_CASE_REMIND(id), {
      fromUserId,
      fromUserName,
    });
  },
};
