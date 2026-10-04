import type {
  CAPFilter,
  NCCFilter,
  RegulationFilter,
  ReportFilter,
  AssignmentFilter,
  ObligationFilter,
} from "@/types";

export const capKeys = {
  all: ["cap"] as const,
  lists: () => [...capKeys.all, "list"] as const,
  list: (filters: CAPFilter) => [...capKeys.lists(), filters] as const,
  details: () => [...capKeys.all, "detail"] as const,
  detail: (id: string) => [...capKeys.details(), id] as const,
  timeline: (id: string) => [...capKeys.detail(id), "timeline"] as const,
  comments: (id: string) => [...capKeys.detail(id), "comments"] as const,
};

export const nccKeys = {
  all: ["ncc"] as const,
  lists: () => [...nccKeys.all, "list"] as const,
  list: (filters: NCCFilter) => [...nccKeys.lists(), filters] as const,
  details: () => [...nccKeys.all, "detail"] as const,
  detail: (id: string) => [...nccKeys.details(), id] as const,
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

export const obligationKeys = {
  all: ["obligation"] as const,
  lists: () => [...obligationKeys.all, "list"] as const,
  list: (filters: ObligationFilter) =>
    [...obligationKeys.lists(), filters] as const,
  details: () => [...obligationKeys.all, "detail"] as const,
  detail: (id: string) => [...obligationKeys.details(), id] as const,
  timeline: (id: string) => [...obligationKeys.detail(id), "timeline"] as const,
  comments: (id: string) => [...obligationKeys.detail(id), "comments"] as const,
  bulk: () => [...obligationKeys.all, "bulk"] as const,
};

export const fileKeys = {
  all: ["files"] as const,
  lists: () => [...fileKeys.all, "list"] as const,
  list: (filters: { capId?: string; nccId?: string; search?: string }) =>
    [...fileKeys.lists(), filters] as const,
  byCap: (capId: string) => [...fileKeys.all, "cap", capId] as const,
  byNcc: (nccId: string) => [...fileKeys.all, "ncc", nccId] as const,
};

export const reportKeys = {
  all: ["reports"] as const,
  byType: (type: string, filters?: ReportFilter) =>
    [...reportKeys.all, type, filters ?? {}] as const,
};

export const ewsKeys = {
  all: ["ews"] as const,
  report: (filters?: { from?: string; to?: string }) =>
    [...ewsKeys.all, "report", filters ?? {}] as const,
};

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  user: (id: string) => [...adminKeys.users(), id] as const,
  roles: () => [...adminKeys.all, "roles"] as const,
  organization: () => [...adminKeys.all, "organization"] as const,
  auditLogs: () => [...adminKeys.all, "audit-logs"] as const,
  aiConfig: () => [...adminKeys.all, "ai-config"] as const,
};

export const cmsKeys = {
  all: ["cms"] as const,
  overview: () => [...cmsKeys.all, "overview"] as const,
  legalUpdates: () => [...cmsKeys.all, "legal-updates"] as const,
  legalUpdate: (id: string) => [...cmsKeys.legalUpdates(), id] as const,
  qdnbList: () => [...cmsKeys.all, "qdnb"] as const,
  qdnb: (id: string) => [...cmsKeys.qdnbList(), id] as const,
  revisions: () => [...cmsKeys.all, "revisions"] as const,
  icis: () => [...cmsKeys.all, "icis"] as const,
  icisSuggestion: (id: string) =>
    [...cmsKeys.icis(), "suggestion", id] as const,
  riskMatrices: () => [...cmsKeys.all, "risk-matrices"] as const,
  escalationRules: () => [...cmsKeys.all, "escalation-rules"] as const,
  reports: () => [...cmsKeys.all, "reports"] as const,
  search: (q: string, mode: string) =>
    [...cmsKeys.all, "search", q, mode] as const,
  history: (entityId: string) => [...cmsKeys.all, "history", entityId] as const,
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
