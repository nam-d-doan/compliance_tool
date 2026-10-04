import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  CMSService,
  type AssignRevisionInput,
  type IssueWorkflowAction,
} from "@/services/cms_service";
import {
  adminKeys,
  cmsKeys,
  dashboardKeys,
  nccKeys,
  notificationKeys,
  regulationKeys,
} from "@/hooks/query-keys";
import type {
  EscalationRule,
  LegalMapping,
  RiskLevel,
  RiskMatrix,
  RiskScores,
} from "@/types";

/**
 * CMS actions ripple across modules (an ICIS acceptance creates an issue, an
 * escalation adds notifications and audit entries...), so every CMS mutation
 * refreshes the CMS caches plus issues, notifications, audit logs and
 * dashboards.
 */
export function invalidateCms(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: cmsKeys.all });
  qc.invalidateQueries({ queryKey: nccKeys.all });
  qc.invalidateQueries({ queryKey: notificationKeys.all });
  qc.invalidateQueries({ queryKey: adminKeys.auditLogs() });
  qc.invalidateQueries({ queryKey: dashboardKeys.all });
}

function useCmsMutation<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
  extra?: (qc: QueryClient) => void,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      invalidateCms(qc);
      extra?.(qc);
    },
  });
}

export function useRunScheduler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offsetDays: number) => CMSService.runScheduler(offsetDays),
    // The demo clock moves "today" for every module, so refresh everything.
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useSyncLegalFeed() {
  return useCmsMutation(() => CMSService.syncLegalFeed());
}

export function useOcrLegalDocument() {
  return useCmsMutation((fileName: string) =>
    CMSService.ocrLegalDocument(fileName),
  );
}

export function useMarkLegalRead() {
  return useCmsMutation((id: string) => CMSService.markLegalRead(id));
}

export function useSetApplicability(id: string) {
  return useCmsMutation(
    (v: {
      decision: "applicable" | "not_applicable" | "under_review";
      reason?: string;
    }) => CMSService.setApplicability(id, v.decision, v.reason),
  );
}

export function useSaveMappings(id: string) {
  return useCmsMutation((v: { mappings: LegalMapping[]; confirm?: boolean }) =>
    CMSService.saveMappings(id, v.mappings, v.confirm),
  );
}

export function useAssignRevisions(id: string) {
  return useCmsMutation((tasks: AssignRevisionInput[]) =>
    CMSService.assignRevisions(id, tasks),
  );
}

export function useImportLegalToLibrary() {
  return useCmsMutation(
    (id: string) => CMSService.importToLibrary(id),
    (qc) => qc.invalidateQueries({ queryKey: regulationKeys.all }),
  );
}

export function useUpdateRevision() {
  return useCmsMutation(
    (v: {
      id: string;
      patch: {
        progress?: number;
        expectedIssueDate?: string;
        committedDate?: string;
      };
    }) => CMSService.updateRevision(v.id, v.patch),
  );
}

export function useAdvanceRevision() {
  return useCmsMutation(
    (v: {
      id: string;
      action: "start" | "submit" | "approve" | "return";
      comment?: string;
    }) => CMSService.advanceRevision(v.id, v.action, v.comment),
  );
}

export function useIssueRevision() {
  return useCmsMutation(
    (v: {
      id: string;
      input: {
        decisionNo: string;
        issueDate: string;
        effectiveDate: string;
        fileName: string;
        note?: string;
      };
    }) => CMSService.issueRevision(v.id, v.input),
  );
}

export function useAcknowledgeEscalation() {
  return useCmsMutation(
    (v: {
      entityType: "ncc" | "revision";
      entityId: string;
      escalationId: string;
    }) =>
      CMSService.acknowledgeEscalation(
        v.entityType,
        v.entityId,
        v.escalationId,
      ),
  );
}

export function useSyncIcis() {
  return useCmsMutation(() => CMSService.syncIcis());
}

export function useAcceptIcis() {
  return useCmsMutation(
    (v: {
      id: string;
      ownerId: string;
      ownerName: string;
      dueDate: string;
      scores?: RiskScores;
      overrideLevel?: RiskLevel;
      overrideReason?: string;
    }) => {
      const { id, ...input } = v;
      return CMSService.acceptIcis(id, input);
    },
  );
}

export function useMergeIcis() {
  return useCmsMutation((v: { id: string; issueId: string }) =>
    CMSService.mergeIcis(v.id, v.issueId),
  );
}

export function useRejectIcis() {
  return useCmsMutation((v: { id: string; reason: string }) =>
    CMSService.rejectIcis(v.id, v.reason),
  );
}

export function useRateIssue(id: string) {
  return useCmsMutation(
    (v: {
      scores: RiskScores;
      overrideLevel?: RiskLevel;
      overrideReason?: string;
    }) => CMSService.rateIssue(id, v),
  );
}

export function useIssueWorkflow(id: string) {
  return useCmsMutation(
    (v: {
      action: IssueWorkflowAction;
      note?: string;
      fileNames?: string[];
      comment?: string;
      resolution?: string;
    }) => CMSService.issueWorkflow(id, v),
  );
}

export function useSaveRiskMatrix() {
  return useCmsMutation(
    (v: {
      criteria: RiskMatrix["criteria"];
      thresholds: RiskMatrix["thresholds"];
      note?: string;
      activate?: boolean;
    }) => CMSService.saveRiskMatrix(v),
  );
}

export function useUpdateEscalationRule() {
  return useCmsMutation((v: { id: string; patch: Partial<EscalationRule> }) =>
    CMSService.updateEscalationRule(v.id, v.patch),
  );
}

export function useSubmitReport() {
  return useCmsMutation((id: string) => CMSService.submitReport(id));
}

export function useClientAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      action: "export" | "ai_usage";
      module: string;
      object: string;
      details?: string;
    }) => CMSService.audit(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.auditLogs() }),
  });
}
