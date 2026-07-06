import { useQuery } from "@tanstack/react-query";
import { AdminService } from "@/services";
import { adminKeys } from "@/hooks/query-keys";

export function useAdminUsers(
  page = 1,
  pageSize = 20,
  filters: {
    role?: string;
    status?: string;
    department?: string;
    search?: string;
  } = {},
) {
  return useQuery({
    queryKey: [...adminKeys.users(), filters, page, pageSize],
    queryFn: () => AdminService.users(page, pageSize, filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminRoles() {
  return useQuery({
    queryKey: adminKeys.roles(),
    queryFn: () => AdminService.roles(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminOrganization() {
  return useQuery({
    queryKey: adminKeys.organization(),
    queryFn: () => AdminService.organization(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminOrganizationSettings() {
  return useQuery({
    queryKey: [...adminKeys.organization(), "settings"],
    queryFn: () => AdminService.organization().then((res) => res.settings),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminTemplates(
  page = 1,
  pageSize = 20,
  filters: { status?: string; search?: string } = {},
) {
  return useQuery({
    queryKey: [...adminKeys.templates(), filters, page, pageSize],
    queryFn: () => AdminService.templates(page, pageSize, filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminAuditLogs(
  page = 1,
  pageSize = 20,
  filters: { action?: string; module?: string; user?: string } = {},
) {
  return useQuery({
    queryKey: [...adminKeys.auditLogs(), filters, page, pageSize],
    queryFn: () => AdminService.auditLogs(page, pageSize, filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminAIConfig() {
  return useQuery({
    queryKey: adminKeys.aiConfig(),
    queryFn: () => AdminService.aiConfig(),
    staleTime: 5 * 60 * 1000,
  });
}
