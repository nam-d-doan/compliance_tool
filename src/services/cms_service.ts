import { apiGet, apiPost, apiPut } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  AuditLog,
  CmsOverview,
  EscalationRule,
  IcisFinding,
  InternalRegulation,
  LegalMapping,
  LegalUpdate,
  NonComplianceCase,
  Paginated,
  ReportTemplate,
  RevisionTask,
  RiskLevel,
  RiskMatrix,
  RiskScores,
  ScheduledReport,
  SchedulerResult,
} from "@/types";

export interface QdnbDetail {
  regulation: InternalRegulation;
  revisions: RevisionTask[];
  legalUpdates: LegalUpdate[];
}

export interface AssignRevisionInput {
  mappingId: string;
  leadUnitId: string;
  supportUnitIds: string[];
  ownerName: string;
  committedDate: string;
}

export interface IcisSuggestion {
  scores: RiskScores;
  repeatCount: number;
  similar: { id: string; nccId: string; title: string }[];
}

export interface SearchHit {
  id: string;
  kind: "law" | "qdnb" | "article" | "issue";
  title: string;
  subtitle: string;
  snippet: string;
  url: string;
  relevance: number;
}

export type IssueWorkflowAction =
  "check" | "submit" | "accept" | "return" | "approve" | "reopen";

export const CMSService = {
  overview() {
    return apiGet<CmsOverview>(API_ENDPOINTS.CMS_OVERVIEW);
  },
  runScheduler(offsetDays: number) {
    return apiPost<SchedulerResult>(API_ENDPOINTS.CMS_SCHEDULER_RUN, {
      offsetDays,
    });
  },

  // Legal updates
  legalUpdates() {
    return apiGet<LegalUpdate[]>(API_ENDPOINTS.CMS_LEGAL_UPDATES);
  },
  legalUpdate(id: string) {
    return apiGet<LegalUpdate>(API_ENDPOINTS.CMS_LEGAL_UPDATE(id));
  },
  syncLegalFeed() {
    return apiPost<{ added: LegalUpdate[] }>(API_ENDPOINTS.CMS_LEGAL_SYNC, {});
  },
  ocrLegalDocument(fileName: string) {
    return apiPost<LegalUpdate>(API_ENDPOINTS.CMS_LEGAL_OCR, { fileName });
  },
  markLegalRead(id: string) {
    return apiPost<LegalUpdate>(API_ENDPOINTS.CMS_LEGAL_READ(id), {});
  },
  setApplicability(
    id: string,
    decision: "applicable" | "not_applicable" | "under_review",
    reason?: string,
  ) {
    return apiPost<LegalUpdate>(API_ENDPOINTS.CMS_LEGAL_APPLICABILITY(id), {
      decision,
      reason,
    });
  },
  saveMappings(id: string, mappings: LegalMapping[], confirm = false) {
    return apiPut<LegalUpdate>(API_ENDPOINTS.CMS_LEGAL_MAPPINGS(id), {
      mappings,
      confirm,
    });
  },
  assignRevisions(id: string, tasks: AssignRevisionInput[]) {
    return apiPost<{ legalUpdate: LegalUpdate; tasks: RevisionTask[] }>(
      API_ENDPOINTS.CMS_LEGAL_ASSIGN(id),
      { tasks },
    );
  },
  importToLibrary(id: string) {
    return apiPost<LegalUpdate>(API_ENDPOINTS.CMS_LEGAL_IMPORT(id), {});
  },

  // QĐNB & revisions
  qdnbList() {
    return apiGet<InternalRegulation[]>(API_ENDPOINTS.CMS_QDNB_LIST);
  },
  qdnb(id: string) {
    return apiGet<QdnbDetail>(API_ENDPOINTS.CMS_QDNB(id));
  },
  revisions() {
    return apiGet<RevisionTask[]>(API_ENDPOINTS.CMS_REVISIONS);
  },
  updateRevision(
    id: string,
    patch: Partial<
      Pick<RevisionTask, "progress" | "expectedIssueDate" | "committedDate">
    >,
  ) {
    return apiPut<RevisionTask>(API_ENDPOINTS.CMS_REVISION(id), patch);
  },
  advanceRevision(
    id: string,
    action: "start" | "submit" | "approve" | "return",
    comment?: string,
  ) {
    return apiPost<RevisionTask>(API_ENDPOINTS.CMS_REVISION_ADVANCE(id), {
      action,
      comment,
    });
  },
  issueRevision(
    id: string,
    input: {
      decisionNo: string;
      issueDate: string;
      effectiveDate: string;
      fileName: string;
      note?: string;
    },
  ) {
    return apiPost<RevisionTask>(API_ENDPOINTS.CMS_REVISION_ISSUE(id), input);
  },
  acknowledgeEscalation(
    entityType: "ncc" | "revision",
    entityId: string,
    escalationId: string,
  ) {
    return apiPost<unknown>(API_ENDPOINTS.CMS_ESCALATION_ACK, {
      entityType,
      entityId,
      escalationId,
    });
  },

  // ICIS
  icisFindings() {
    return apiGet<IcisFinding[]>(API_ENDPOINTS.CMS_ICIS);
  },
  syncIcis() {
    return apiPost<{ added: IcisFinding[] }>(API_ENDPOINTS.CMS_ICIS_SYNC, {});
  },
  icisSuggestion(id: string) {
    return apiGet<IcisSuggestion>(API_ENDPOINTS.CMS_ICIS_SUGGESTION(id));
  },
  acceptIcis(
    id: string,
    input: {
      ownerId: string;
      ownerName: string;
      dueDate: string;
      scores?: RiskScores;
      overrideLevel?: RiskLevel;
      overrideReason?: string;
    },
  ) {
    return apiPost<{ finding: IcisFinding; issue: NonComplianceCase }>(
      API_ENDPOINTS.CMS_ICIS_ACCEPT(id),
      input,
    );
  },
  mergeIcis(id: string, issueId: string) {
    return apiPost<{ finding: IcisFinding; issue: NonComplianceCase }>(
      API_ENDPOINTS.CMS_ICIS_MERGE(id),
      { issueId },
    );
  },
  rejectIcis(id: string, reason: string) {
    return apiPost<IcisFinding>(API_ENDPOINTS.CMS_ICIS_REJECT(id), { reason });
  },

  // Issues
  rateIssue(
    id: string,
    input: {
      scores: RiskScores;
      overrideLevel?: RiskLevel;
      overrideReason?: string;
    },
  ) {
    return apiPost<NonComplianceCase>(API_ENDPOINTS.CMS_ISSUE_RATE(id), input);
  },
  issueWorkflow(
    id: string,
    input: {
      action: IssueWorkflowAction;
      note?: string;
      fileNames?: string[];
      comment?: string;
      resolution?: string;
    },
  ) {
    return apiPost<NonComplianceCase>(
      API_ENDPOINTS.CMS_ISSUE_WORKFLOW(id),
      input,
    );
  },

  // Risk matrix & escalation
  riskMatrices() {
    return apiGet<RiskMatrix[]>(API_ENDPOINTS.CMS_RISK_MATRICES);
  },
  saveRiskMatrix(input: {
    criteria: RiskMatrix["criteria"];
    thresholds: RiskMatrix["thresholds"];
    note?: string;
    activate?: boolean;
  }) {
    return apiPost<RiskMatrix>(API_ENDPOINTS.CMS_RISK_MATRICES, input);
  },
  escalationRules() {
    return apiGet<EscalationRule[]>(API_ENDPOINTS.CMS_ESCALATION_RULES);
  },
  updateEscalationRule(id: string, patch: Partial<EscalationRule>) {
    return apiPut<EscalationRule>(API_ENDPOINTS.CMS_ESCALATION_RULE(id), patch);
  },

  // Reports
  reports() {
    return apiGet<{ templates: ReportTemplate[]; schedule: ScheduledReport[] }>(
      API_ENDPOINTS.CMS_REPORTS,
    );
  },
  submitReport(id: string) {
    return apiPost<ScheduledReport>(API_ENDPOINTS.CMS_REPORT_SUBMIT(id), {});
  },
  audit(input: {
    action: "export" | "ai_usage";
    module: string;
    object: string;
    details?: string;
  }) {
    return apiPost<AuditLog>(API_ENDPOINTS.CMS_AUDIT, input);
  },

  // Search & history
  search(q: string, mode: "semantic" | "keyword") {
    return apiGet<SearchHit[]>(
      `${API_ENDPOINTS.CMS_SEARCH}?q=${encodeURIComponent(q)}&mode=${mode}`,
    );
  },
  history(entityId: string) {
    return apiGet<Paginated<AuditLog>>(
      `${API_ENDPOINTS.ADMIN_AUDIT_LOGS}?entityId=${encodeURIComponent(entityId)}&pageSize=200`,
    );
  },
};
