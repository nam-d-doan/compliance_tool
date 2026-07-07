import type {
  ComplianceFilter,
  CAPFilter,
  RegulationFilter,
  ReportFilter,
  AssignmentFilter,
} from "@/types";

export const complianceKeys = {
  all: ["compliance"] as const,
  lists: () => [...complianceKeys.all, "list"] as const,
  list: (filters: ComplianceFilter) =>
    [...complianceKeys.lists(), filters] as const,
  details: () => [...complianceKeys.all, "detail"] as const,
  detail: (id: string) => [...complianceKeys.details(), id] as const,
  timeline: (id: string) => [...complianceKeys.detail(id), "timeline"] as const,
  comments: (id: string) => [...complianceKeys.detail(id), "comments"] as const,
  history: (filters: ComplianceFilter) =>
    [...complianceKeys.all, "history", filters] as const,
};

export const capKeys = {
  all: ["cap"] as const,
  lists: () => [...capKeys.all, "list"] as const,
  list: (filters: CAPFilter) => [...capKeys.lists(), filters] as const,
  details: () => [...capKeys.all, "detail"] as const,
  detail: (id: string) => [...capKeys.details(), id] as const,
  timeline: (id: string) => [...capKeys.detail(id), "timeline"] as const,
  comments: (id: string) => [...capKeys.detail(id), "comments"] as const,
};

export const regulationKeys = {
  all: ["regulation"] as const,
  lists: () => [...regulationKeys.all, "list"] as const,
  list: (filters: RegulationFilter) =>
    [...regulationKeys.lists(), filters] as const,
  details: () => [...regulationKeys.all, "detail"] as const,
  detail: (id: string) => [...regulationKeys.details(), id] as const,
  comparison: () => [...regulationKeys.all, "comparison"] as const,
  impact: (id: string) => [...regulationKeys.detail(id), "impact"] as const,
  dependencies: (id: string) =>
    [...regulationKeys.detail(id), "dependencies"] as const,
  vietlex: (query: string) =>
    [...regulationKeys.all, "vietlex", query] as const,
};

export const assignmentKeys = {
  all: ["assignment"] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
  list: (filters: AssignmentFilter) =>
    [...assignmentKeys.lists(), filters] as const,
  details: () => [...assignmentKeys.all, "detail"] as const,
  detail: (id: string) => [...assignmentKeys.details(), id] as const,
  timeline: (id: string) => [...assignmentKeys.detail(id), "timeline"] as const,
};

export const reportKeys = {
  all: ["reports"] as const,
  byType: (type: string, filters?: ReportFilter) =>
    [...reportKeys.all, type, filters ?? {}] as const,
};

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  user: (id: string) => [...adminKeys.users(), id] as const,
  roles: () => [...adminKeys.all, "roles"] as const,
  organization: () => [...adminKeys.all, "organization"] as const,
  templates: () => [...adminKeys.all, "templates"] as const,
  template: (id: string) => [...adminKeys.templates(), id] as const,
  auditLogs: () => [...adminKeys.all, "audit-logs"] as const,
  aiConfig: () => [...adminKeys.all, "ai-config"] as const,
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  byRole: (role: string) => [...dashboardKeys.all, role] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export const aiKeys = {
  all: ["ai"] as const,
  copilot: () => [...aiKeys.all, "copilot"] as const,
  capSuggestion: (id?: string) =>
    [...aiKeys.all, "cap-suggestion", id ?? "new"] as const,
  riskScore: (id: string) => [...aiKeys.all, "risk-score", id] as const,
  executiveSummary: () => [...aiKeys.all, "executive-summary"] as const,
};
