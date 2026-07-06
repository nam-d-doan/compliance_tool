import { useQuery, useMutation } from "@tanstack/react-query";
import { AIService } from "@/services";
import { aiKeys } from "@/hooks/query-keys";
import type { AISuggestedCAP } from "@/types";

export function useGenerateCAP() {
  return useMutation<
    AISuggestedCAP,
    Error,
    { complianceId?: string; description?: string }
  >({
    mutationFn: ({ complianceId, description }) =>
      AIService.generateCAP(complianceId, description),
  });
}

export function useExecutiveSummary() {
  return useQuery({
    queryKey: aiKeys.executiveSummary(),
    queryFn: () => AIService.executiveSummary(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplianceRiskScore(id: string) {
  return useQuery({
    queryKey: aiKeys.riskScore(id),
    queryFn: () => AIService.complianceRiskScore(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvidenceValidation(id: string) {
  return useQuery({
    queryKey: aiKeys.evidenceValidation(id),
    queryFn: () => AIService.validateEvidence(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
