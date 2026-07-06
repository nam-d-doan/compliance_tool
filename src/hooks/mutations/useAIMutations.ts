import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AIService } from "@/services";
import { aiKeys, evidenceKeys } from "@/hooks/query-keys";

export function useCopilotMessage() {
  return useMutation({
    mutationFn: ({
      message,
      threadId,
      mode,
      context,
    }: {
      message: string;
      threadId?: string;
      mode?: string;
      context?: { route?: string; role?: string | null };
    }) => AIService.copilotMessage(message, threadId, mode, context),
  });
}

export function useGenerateCAP() {
  return useMutation({
    mutationFn: ({
      complianceId,
      description,
    }: {
      complianceId?: string;
      description?: string;
    }) => AIService.generateCAP(complianceId, description),
  });
}

export function useRegulationImpact() {
  return useMutation({
    mutationFn: (regulationId: string) =>
      AIService.regulationImpact(regulationId),
  });
}

export function useValidateEvidence(evidenceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => AIService.validateEvidence(evidenceId),
    onSuccess: () => {
      if (evidenceId) {
        queryClient.invalidateQueries({
          queryKey: evidenceKeys.detail(evidenceId),
        });
        queryClient.invalidateQueries({
          queryKey: aiKeys.evidenceValidation(evidenceId),
        });
      }
    },
  });
}
