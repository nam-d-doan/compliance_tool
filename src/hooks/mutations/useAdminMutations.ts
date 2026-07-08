import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminService } from "@/services";
import { adminKeys } from "@/hooks/query-keys";
import type {
  UserProfile,
  RoleEntity,
  AIConfig,
  OrganizationSettings,
} from "@/types";

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => AdminService.createUser(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.users() }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserProfile> }) =>
      AdminService.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(variables.id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.deleteUser(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.users() }),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RoleEntity>) => AdminService.createRole(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() }),
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RoleEntity>) =>
      AdminService.updateRole(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.deleteRole(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() }),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OrganizationSettings>) =>
      AdminService.updateOrganization(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.organization() }),
  });
}

export function useUpdateAIConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AIConfig>) => AdminService.updateAIConfig(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.aiConfig() }),
  });
}
