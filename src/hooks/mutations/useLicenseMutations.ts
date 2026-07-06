import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LicenseService } from "@/services";
import { licenseKeys } from "@/hooks/query-keys";
import type { License, LicenseFilter } from "@/types";

export function useCreateLicense(filters: LicenseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<License>) => LicenseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.list(filters) });
    },
  });
}

export function useUpdateLicense(id: string, filters: LicenseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<License>) => LicenseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.list(filters) });
    },
  });
}

export function useDeleteLicense(filters: LicenseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LicenseService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.list(filters) });
    },
  });
}

export function useAddLicenseComment(id: string) {
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
    }) => LicenseService.addComment(id, content, userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...licenseKeys.detail(id), "comments"],
      });
    },
  });
}
