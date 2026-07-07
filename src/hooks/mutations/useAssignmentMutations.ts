import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AssignmentService } from "@/services";
import { assignmentKeys } from "@/hooks/query-keys";
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  BulkAssignmentInput,
  AssignmentFilter,
} from "@/types";

export function useCreateAssignment(filters: AssignmentFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssignmentInput) => AssignmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list(filters) });
    },
  });
}

export function useUpdateAssignment(
  id: string,
  filters: AssignmentFilter = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAssignmentInput) =>
      AssignmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list(filters) });
    },
  });
}

export function useAcknowledgeAssignment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => AssignmentService.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}

export function useCancelAssignment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => AssignmentService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}

export function useBulkUpdateAssignments(filters: AssignmentFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkAssignmentInput) => AssignmentService.bulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list(filters) });
    },
  });
}
