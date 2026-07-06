import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  AICopilotMessage,
  AISuggestedCAP,
  AIRiskScoreResult,
  AIEvidenceValidationResult,
  RegulationImpact,
  AIExplanation,
} from "@/types";

export const AIService = {
  copilotMessage(
    message: string,
    threadId?: string,
    mode?: string,
    context?: { route?: string; role?: string | null },
  ) {
    return apiPost<AICopilotMessage>(API_ENDPOINTS.AI_COPILOT_MESSAGE, {
      message,
      threadId,
      mode,
      route: context?.route,
      role: context?.role,
    });
  },

  generateCAP(complianceId?: string, description?: string) {
    return apiPost<AISuggestedCAP>(API_ENDPOINTS.AI_CAP_GENERATE, {
      complianceId,
      description,
    });
  },

  complianceRiskScore(complianceId?: string) {
    return apiPost<AIRiskScoreResult>(API_ENDPOINTS.AI_COMPLIANCE_RISK_SCORE, {
      complianceId,
    });
  },

  regulationImpact(regulationId?: string) {
    return apiPost<{ impact: RegulationImpact; explanation: AIExplanation }>(
      API_ENDPOINTS.AI_REGULATION_IMPACT,
      { regulationId },
    );
  },

  executiveSummary() {
    return apiPost<{ summary: string; explanation: AIExplanation }>(
      API_ENDPOINTS.AI_EXECUTIVE_SUMMARY,
      {},
    );
  },

  validateEvidence(evidenceId?: string) {
    return apiPost<AIEvidenceValidationResult>(
      API_ENDPOINTS.AI_EVIDENCE_VALIDATE,
      { evidenceId },
    );
  },
};
