import { useQuery } from "@tanstack/react-query";
import { LawService } from "@/services";
import { lawKeys } from "@/hooks/query-keys";
import type { LawRequestFilter } from "@/types";

export function useLawRequestList(
  filters: LawRequestFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: lawKeys.list({ ...filters, page, pageSize }),
    queryFn: () => LawService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLawRequestDetail(id: string) {
  return useQuery({
    queryKey: lawKeys.detail(id),
    queryFn: () => LawService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLawRequestEvents(id: string) {
  return useQuery({
    queryKey: lawKeys.events(id),
    queryFn: () => LawService.events(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
