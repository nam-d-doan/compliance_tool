import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  UserProfile,
  RoleEntity,
  AuditLog,
  AIConfig,
  Organization,
  OrganizationSettings,
  Paginated,
} from "@/types";

export const AdminService = {
  users(
    page = 1,
    pageSize = 20,
    filters: {
      role?: string;
      status?: string;
      department?: string;
      search?: string;
    } = {},
  ) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return apiGet<Paginated<UserProfile>>(
      `${API_ENDPOINTS.ADMIN_USERS}?${params.toString()}`,
    );
  },

  createUser(data: Partial<UserProfile>) {
    return apiPost<UserProfile>(API_ENDPOINTS.ADMIN_USERS, data);
  },

  updateUser(id: string, data: Partial<UserProfile>) {
    return apiPut<UserProfile>(API_ENDPOINTS.ADMIN_USER(id), data);
  },

  deleteUser(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.ADMIN_USER(id));
  },

  roles() {
    return apiGet<RoleEntity[]>(API_ENDPOINTS.ADMIN_ROLES);
  },

  createRole(data: Partial<RoleEntity>) {
    return apiPost<RoleEntity>(API_ENDPOINTS.ADMIN_ROLES, data);
  },

  updateRole(id: string, data: Partial<RoleEntity>) {
    return apiPut<RoleEntity>(API_ENDPOINTS.ADMIN_ROLE(id), data);
  },

  deleteRole(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.ADMIN_ROLE(id));
  },

  organization() {
    return apiGet<{
      organizations: Organization[];
      settings: OrganizationSettings;
    }>(API_ENDPOINTS.ADMIN_ORG);
  },

  updateOrganization(data: Partial<OrganizationSettings>) {
    return apiPut<OrganizationSettings>(API_ENDPOINTS.ADMIN_ORG, data);
  },

  auditLogs(
    page = 1,
    pageSize = 20,
    filters: { action?: string; module?: string; user?: string } = {},
  ) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return apiGet<Paginated<AuditLog>>(
      `${API_ENDPOINTS.ADMIN_AUDIT_LOGS}?${params.toString()}`,
    );
  },

  aiConfig() {
    return apiGet<AIConfig>(API_ENDPOINTS.ADMIN_AI_CONFIG);
  },

  updateAIConfig(data: Partial<AIConfig>) {
    return apiPut<AIConfig>(API_ENDPOINTS.ADMIN_AI_CONFIG, data);
  },
};
