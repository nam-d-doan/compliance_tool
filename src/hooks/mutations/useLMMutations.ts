import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LMService } from "@/services";
import { lmKeys } from "@/hooks/query-keys";
import type { LMCaseFilter, CreateLMCaseInput, UpdateLMCaseInput } from "@/types";

export function useCreateLMCase(filters: LMCaseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLMCaseInput) => LMService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lmKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lmKeys.list(filters) });
    },
  });
}

export function useUpdateLMCase(id: string, filters: LMCaseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLMCaseInput) => LMService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lmKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lmKeys.events(id) });
      queryClient.invalidateQueries({ queryKey: lmKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lmKeys.list(filters) });
    },
  });
}

export function useDeleteLMCase(filters: LMCaseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LMService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lmKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lmKeys.list(filters) });
    },
  });
}
