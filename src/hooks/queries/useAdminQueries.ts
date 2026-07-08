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

export interface OrgUnit {
  id: string;
  name: string;
  type: "ho_department" | "branch";
  region?: string; // only for branches
}

export function useOrgUnits() {
  return useQuery({
    queryKey: [...adminKeys.organization(), "units"],
    queryFn: () =>
      AdminService.organization().then((res) => {
        const settings = res.settings;
        const allUnits: OrgUnit[] = [
          ...settings.hoDepartments.map((d) => ({
            id: d.id,
            name: d.name,
            type: "ho_department" as const,
          })),
          ...settings.branches.map((b) => ({
            id: b.id,
            name: b.name,
            type: "branch" as const,
            region: b.region,
          })),
        ];
        return {
          hoDepartments: settings.hoDepartments,
          branches: settings.branches,
          allUnits,
          getUnitById: (id: string) => allUnits.find((u) => u.id === id),
        };
      }),
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
