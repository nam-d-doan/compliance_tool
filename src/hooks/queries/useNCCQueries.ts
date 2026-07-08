import { useQuery } from "@tanstack/react-query";
import { NCCService } from "@/services";
import { nccKeys } from "@/hooks/query-keys";
import type { NCCFilter } from "@/types";

export function useNCCList(filters: NCCFilter = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: nccKeys.list({ ...filters, page, pageSize }),
    queryFn: () => NCCService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNCCDetail(id: string) {
  return useQuery({
    queryKey: nccKeys.detail(id),
    queryFn: () => NCCService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
