import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ObligationService } from "@/services";
import { obligationKeys, assignmentKeys } from "@/hooks/query-keys";
import type {
  BulkCreateObligationsInput,
  BulkCreateObligationsResult,
  Obligation,
  ObligationFilter,
} from "@/types";

/**
 * Bulk-create obligations via POST /api/obligations/bulk.
 * On success, invalidates obligation + assignment lists so the assignment
 * detail's "Obligations" tab reflects the new rows.
 */
export function useBulkCreateObligations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateObligationsInput) =>
      ObligationService.bulkCreate(data),
    onSuccess: (data: BulkCreateObligationsResult) => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.lists() });
      // Refresh the parent assignment so its Obligations tab updates.
      data.items.forEach((item) => {
        if (item.assignmentId) {
          queryClient.invalidateQueries({
            queryKey: assignmentKeys.detail(item.assignmentId),
          });
        }
      });
    },
  });
}

export function useUpdateObligation(
  id: string,
  filters: ObligationFilter = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Obligation>) =>
      ObligationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: obligationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: obligationKeys.list(filters) });
    },
  });
}

export function useDeleteObligation(filters: ObligationFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ObligationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: obligationKeys.list(filters) });
    },
  });
}

export function useAddObligationComment(id: string) {
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
    }) => ObligationService.addComment(id, content, userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.comments(id) });
    },
  });
}
