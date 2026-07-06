import { useQuery } from "@tanstack/react-query";
import { CAPService } from "@/services";
import { capKeys } from "@/hooks/query-keys";
import type { CAPFilter } from "@/types";

export function useCAPList(filters: CAPFilter = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: capKeys.list({ ...filters, page, pageSize }),
    queryFn: () => CAPService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCAPDetail(id: string) {
  return useQuery({
    queryKey: capKeys.detail(id),
    queryFn: () => CAPService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCAPTimeline(id: string) {
  return useQuery({
    queryKey: capKeys.timeline(id),
    queryFn: () => CAPService.timeline(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCAPComments(id: string) {
  return useQuery({
    queryKey: capKeys.comments(id),
    queryFn: () => CAPService.comments(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
