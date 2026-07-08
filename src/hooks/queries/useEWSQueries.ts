import { useQuery } from "@tanstack/react-query";
import { EWSService } from "@/services";
import { ewsKeys } from "@/hooks/query-keys";

export function useEWSReport(filters: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ewsKeys.report(filters),
    queryFn: () => EWSService.report(filters),
    staleTime: 5 * 60 * 1000,
  });
}
