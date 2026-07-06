import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EvidenceService } from "@/services";
import { evidenceKeys } from "@/hooks/query-keys";
import type { Evidence, EvidenceFilter } from "@/types";

export function useCreateEvidence(filters: EvidenceFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Evidence>) => EvidenceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenceKeys.list(filters) });
    },
  });
}

export function useUpdateEvidence(id: string, filters: EvidenceFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Evidence>) => EvidenceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenceKeys.list(filters) });
    },
  });
}

export function useDeleteEvidence(filters: EvidenceFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EvidenceService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evidenceKeys.list(filters) });
    },
  });
}

export function useAddEvidenceComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      content,
      userId,
      userName,
    }: {
      content: string;
      userId?: string;
      userName?: string;
    }) => EvidenceService.addComment(id, content, userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.comments(id) });
    },
  });
}
