import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ComplianceService } from "@/services";
import { complianceKeys } from "@/hooks/query-keys";
import type { ComplianceObligation, ComplianceFilter } from "@/types";

export function useCreateCompliance(filters: ComplianceFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ComplianceObligation>) =>
      ComplianceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.list(filters) });
    },
  });
}

export function useUpdateCompliance(
  id: string,
  filters: ComplianceFilter = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ComplianceObligation>) =>
      ComplianceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.list(filters) });
    },
  });
}

export function useDeleteCompliance(filters: ComplianceFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ComplianceService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.list(filters) });
    },
  });
}

export function useAddComplianceComment(id: string) {
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
    }) => ComplianceService.addComment(id, content, userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.comments(id) });
    },
  });
}
