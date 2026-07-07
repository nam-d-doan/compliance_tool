import { useQuery } from "@tanstack/react-query";
import { ObligationService } from "@/services";
import { obligationKeys } from "@/hooks/query-keys";
import type { ObligationFilter } from "@/types";

/**
 * List obligations with server-side filtering. For the owner dashboard pass
 * `owner` (user id) plus status/riskLevel/overdue/withoutCap filters.
 * Defaults to a high pageSize so the dashboard can derive counts/tabs in one
 * round trip; callers that need true pagination should pass page/pageSize.
 */
export function useObligationList(
  filters: ObligationFilter = {},
  page = 1,
  pageSize = 200,
) {
  return useQuery({
    queryKey: obligationKeys.list({ ...filters, page, pageSize }),
    queryFn: () => ObligationService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useObligationDetail(id: string) {
  return useQuery({
    queryKey: obligationKeys.detail(id),
    queryFn: () => ObligationService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
