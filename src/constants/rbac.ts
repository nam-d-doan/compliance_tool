import type { Role } from "@/types";

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 5,
  executive: 4,
  owner: 3,
  approver: 2,
};

// Role permissions
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    "org:create",
    "org:read",
    "org:update",
    "org:delete",
    "compliance:create",
    "compliance:read",
    "compliance:update",
    "compliance:delete",
    "compliance:approve",
    "cap:create",
    "cap:read",
    "cap:update",
    "cap:delete",
    "cap:approve",
    "regulation:create",
    "regulation:read",
    "regulation:update",
    "regulation:delete",
    "assignment:create",
    "assignment:read",
    "assignment:update",
    "assignment:delete",
    "ncc:create",
    "ncc:read",
    "ncc:update",
    "ncc:delete",
    "report:create",
    "report:read",
    "report:update",
    "report:delete",
    "report:approve",
    "legal:read",
    "legal:review",
    "qdnb:read",
    "qdnb:update",
    "qdnb:approve",
    "icis:intake",
    "issue:review",
    "issue:approve",
    "risk:configure",
    "escalation:ack",
  ],
  executive: [
    "compliance:read",
    "compliance:approve",
    "cap:read",
    "cap:approve",
    "regulation:read",
    "assignment:create",
    "assignment:read",
    "assignment:update",
    "ncc:read",
    "report:create",
    "report:read",
    "report:approve",
    "legal:read",
    "qdnb:read",
    "qdnb:approve",
    "issue:approve",
    "escalation:ack",
  ],
  owner: [
    "compliance:create",
    "compliance:read",
    "compliance:update",
    "cap:create",
    "cap:read",
    "cap:update",
    "regulation:read",
    "assignment:create",
    "assignment:read",
    "assignment:update",
    "ncc:create",
    "ncc:read",
    "ncc:update",
    "report:create",
    "report:read",
    "legal:read",
    "legal:review",
    "qdnb:read",
    "qdnb:update",
    "icis:intake",
    "issue:review",
    "escalation:ack",
  ],
  approver: [
    "compliance:read",
    "compliance:approve",
    "cap:read",
    "cap:approve",
    "regulation:read",
    "regulation:create",
    "assignment:read",
    "ncc:read",
    "report:read",
    "legal:read",
    "qdnb:read",
    "qdnb:update",
    "qdnb:approve",
    "issue:approve",
  ],
};

// Helper function to check if a role has a specific permission
export const hasPermission = (
  role: Role | null,
  permission: string,
): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

// Helper function to check if a role has higher or equal access level
export const hasMinimumRole = (
  userRole: Role | null,
  requiredRole: Role,
): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};
