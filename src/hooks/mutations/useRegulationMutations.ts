import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RegulationService } from "@/services";
import { regulationKeys } from "@/hooks/query-keys";
import type { Regulation, RegulationFilter } from "@/types";

export function useCreateRegulation(filters: RegulationFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Regulation>) => RegulationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regulationKeys.list(filters) });
    },
  });
}

export function useUpdateRegulation(
  id: string,
  filters: RegulationFilter = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Regulation>) =>
      RegulationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: regulationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regulationKeys.list(filters) });
    },
  });
}

export function useDeleteRegulation(filters: RegulationFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RegulationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regulationKeys.list(filters) });
    },
  });
}

export function useAddRegulationComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      content,
      userId,
      userName,
    }: {
      content: string;
      userId?: string;
      userName?: string;
    }) => RegulationService.addComment(id, content, userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...regulationKeys.detail(id), "comments"],
      });
    },
  });
}

export function usePublishRegulation(filters: RegulationFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      RegulationService.update(id, { status: "Published" }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: regulationKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: regulationKeys.dependencies(id),
      });
      queryClient.invalidateQueries({ queryKey: regulationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regulationKeys.list(filters) });
    },
  });
}

export function useArchiveRegulation(filters: RegulationFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RegulationService.archive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: regulationKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: regulationKeys.dependencies(id),
      });
      queryClient.invalidateQueries({ queryKey: regulationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regulationKeys.list(filters) });
    },
  });
}

export function useBulkArchiveRegulations(filters: RegulationFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => RegulationService.bulkArchive(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regulationKeys.list(filters) });
    },
  });
}
