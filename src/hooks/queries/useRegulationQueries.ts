import { useQuery } from "@tanstack/react-query";
import { RegulationService } from "@/services";
import { regulationKeys } from "@/hooks/query-keys";
import type { RegulationFilter } from "@/types";

export function useRegulationList(
  filters: RegulationFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: regulationKeys.list({ ...filters, page, pageSize }),
    queryFn: () => RegulationService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegulationDetail(id: string) {
  return useQuery({
    queryKey: regulationKeys.detail(id),
    queryFn: () => RegulationService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegulationTimeline(id: string) {
  return useQuery({
    queryKey: [...regulationKeys.detail(id), "timeline"],
    queryFn: () => RegulationService.timeline(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegulationComments(id: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...regulationKeys.detail(id), "comments", { page, pageSize }],
    queryFn: () => RegulationService.comments(id, page, pageSize),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegulationComparison(a: string, b: string) {
  return useQuery({
    queryKey: [...regulationKeys.comparison(), { a, b }],
    queryFn: () => RegulationService.compare(a, b),
    enabled: Boolean(a && b),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegulationImpact(id: string) {
  return useQuery({
    queryKey: regulationKeys.impact(id),
    queryFn: () => RegulationService.impact(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
