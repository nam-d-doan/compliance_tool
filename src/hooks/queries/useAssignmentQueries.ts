import { useQuery } from "@tanstack/react-query";
import { AssignmentService } from "@/services";
import { assignmentKeys } from "@/hooks/query-keys";
import type { AssignmentFilter } from "@/types";

export function useAssignmentList(
  filters: AssignmentFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: assignmentKeys.list({ ...filters, page, pageSize }),
    queryFn: () => AssignmentService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignmentDetail(id: string) {
  return useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: () => AssignmentService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignmentTimeline(id: string) {
  return useQuery({
    queryKey: assignmentKeys.timeline(id),
    queryFn: () => AssignmentService.timeline(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
