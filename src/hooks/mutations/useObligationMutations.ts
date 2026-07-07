import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ObligationService } from "@/services";
import { obligationKeys, assignmentKeys } from "@/hooks/query-keys";
import type { BulkCreateObligationsInput, BulkCreateObligationsResult } from "@/types";

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
