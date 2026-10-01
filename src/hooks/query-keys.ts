import type {
  CAPFilter,
  NCCFilter,
  RegulationFilter,
  ReportFilter,
  AssignmentFilter,
  ObligationFilter,
  LMCaseFilter,
  LawRequestFilter,
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
  list: (filters: {
    capId?: string;
    nccId?: string;
    caseId?: string;
    search?: string;
  }) => [...fileKeys.lists(), filters] as const,
  byCap: (capId: string) => [...fileKeys.all, "cap", capId] as const,
  byNcc: (nccId: string) => [...fileKeys.all, "ncc", nccId] as const,
  byCase: (caseId: string) => [...fileKeys.all, "case", caseId] as const,
};

export const lmKeys = {
  all: ["lm"] as const,
  lists: () => [...lmKeys.all, "list"] as const,
  list: (filters: LMCaseFilter) => [...lmKeys.lists(), filters] as const,
  details: () => [...lmKeys.all, "detail"] as const,
  detail: (id: string) => [...lmKeys.details(), id] as const,
  milestones: (id: string) => [...lmKeys.detail(id), "milestones"] as const,
  deadlines: (id: string) => [...lmKeys.detail(id), "deadlines"] as const,
  events: (id: string) => [...lmKeys.detail(id), "events"] as const,
  tasks: (id: string) => [...lmKeys.detail(id), "tasks"] as const,
  alertRules: () => [...lmKeys.all, "alert-rules"] as const,
  workload: () => [...lmKeys.all, "workload"] as const,
  dashboard: (ownerId?: string) =>
    [...lmKeys.all, "dashboard", ownerId ?? "all"] as const,
};

export const lawKeys = {
  all: ["law"] as const,
  lists: () => [...lawKeys.all, "list"] as const,
  list: (filters: LawRequestFilter) => [...lawKeys.lists(), filters] as const,
  details: () => [...lawKeys.all, "detail"] as const,
  detail: (id: string) => [...lawKeys.details(), id] as const,
  events: (id: string) => [...lawKeys.detail(id), "events"] as const,
  workload: () => [...lawKeys.all, "workload"] as const,
  slaRules: () => [...lawKeys.all, "sla-rules"] as const,
  knowledgeBase: (search?: string) =>
    [...lawKeys.all, "knowledge-base", search ?? ""] as const,
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
