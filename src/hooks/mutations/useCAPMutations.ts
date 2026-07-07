import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CAPService } from "@/services";
import { capKeys, complianceKeys } from "@/hooks/query-keys";
import type { CAP, CAPFilter } from "@/types";

export function useCreateCAP(filters: CAPFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CAP>) => CAPService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capKeys.lists() });
      queryClient.invalidateQueries({ queryKey: capKeys.list(filters) });
      // Creating a CAP bulk-updates linked obligations' status.
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}

export function useUpdateCAP(id: string, filters: CAPFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CAP>) => CAPService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: capKeys.lists() });
      queryClient.invalidateQueries({ queryKey: capKeys.list(filters) });
      // Closing a CAP bulk-updates linked obligations to Completed.
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}

export function useDeleteCAP(filters: CAPFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CAPService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capKeys.lists() });
      queryClient.invalidateQueries({ queryKey: capKeys.list(filters) });
    },
  });
}

export function useAddCAPComment(id: string) {
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
    }) => CAPService.addComment(id, content, userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capKeys.comments(id) });
    },
  });
}
