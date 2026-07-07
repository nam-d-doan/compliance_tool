import type { Role } from "@/types";
import { hasPermission, hasMinimumRole } from "@/constants/rbac";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShieldCheck,
  List,
  PlusCircle,
  History,
  ClipboardList,
  BookOpen,
  BarChart3,
  Settings2,
  Users,
  UserCog,
  Building2,
  LayoutTemplate,
  ScrollText,
  BrainCircuit,
  Settings,
  ClipboardCheck,
} from "lucide-react";

// Route definitions with paths and permissions
export const ROUTES = {
  // Auth routes
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  MFA: "/mfa",
  UNAUTHORIZED: "/unauthorized",

  // Dashboard routes (role-based)
  DASHBOARD: {
    ROOT: "/dashboard",
    ADMIN: "/dashboard/admin",
    EXECUTIVE: "/dashboard/executive",
    OWNER: "/dashboard/owner",
    APPROVER: "/dashboard/approver",
    REVIEWER: "/dashboard/reviewer",
  },

  // Obligation routes
  OBLIGATIONS: {
    LIST: "/obligations",
    DETAIL: "/obligations/:id",
    CREATE: "/obligations/create",
    HISTORY: "/obligations/history",
  },

  // CAP routes
  CAP: {
    DASHBOARD: "/cap",
    LIST: "/cap/list",
    DETAIL: "/cap/:id",
    CREATE: "/cap/create",
  },

  // Regulation routes
  REGULATION: {
    LIBRARY: "/regulation",
    DETAIL: "/regulation/:id",
    COMPARISON: "/regulation/compare",
    IMPACT: "/regulation/:id/impact",
    CREATE: "/regulation/create",
  },

  // Assignment routes
  ASSIGNMENTS: {
    LIST: "/assignment",
    CREATE: "/assignment/create",
    DETAIL: "/assignment/:id",
  },

  // Reports routes
  REPORTS: {
    STATUS: "/reports/status",
    CALENDAR: "/reports/calendar",
    CAP: "/reports/cap",
    EXECUTIVE: "/reports/executive",
  },

  // Admin routes
  ADMIN: {
    USERS: "/admin/users",
    ROLES: "/admin/roles",
    ORG: "/admin/organization",
    TEMPLATES: "/admin/templates",
    AUDIT_LOGS: "/admin/audit-logs",
    AI_CONFIG: "/admin/ai-config",
  },

  // User routes
  PROFILE: "/profile",
  SETTINGS: "/settings",

  // Fallback
  NOT_FOUND: "/404",
} as const;

// Route permissions mapping (minimum role OR explicit role list)
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  [ROUTES.DASHBOARD.ADMIN]: ["admin"],
  [ROUTES.DASHBOARD.EXECUTIVE]: ["executive", "admin"],
  [ROUTES.DASHBOARD.OWNER]: ["owner", "executive", "admin"],
  [ROUTES.DASHBOARD.APPROVER]: ["approver", "owner", "executive", "admin"],
  [ROUTES.DASHBOARD.REVIEWER]: [
    "reviewer",
    "approver",
    "owner",
    "executive",
    "admin",
  ],

  [ROUTES.OBLIGATIONS.CREATE]: ["owner", "executive", "admin"],
  [ROUTES.OBLIGATIONS.LIST]: [
    "reviewer",
    "approver",
    "owner",
    "executive",
    "admin",
  ],

  [ROUTES.CAP.CREATE]: ["owner", "executive", "admin"],
  [ROUTES.CAP.DASHBOARD]: [
    "reviewer",
    "approver",
    "owner",
    "executive",
    "admin",
  ],
  [ROUTES.CAP.LIST]: ["reviewer", "approver", "owner", "executive", "admin"],

  [ROUTES.REGULATION.CREATE]: ["admin"],

  [ROUTES.ASSIGNMENTS.CREATE]: ["owner", "executive", "admin"],
  [ROUTES.ASSIGNMENTS.LIST]: [
    "reviewer",
    "approver",
    "owner",
    "executive",
    "admin",
  ],

  [ROUTES.ADMIN.USERS]: ["admin"],
  [ROUTES.ADMIN.ROLES]: ["admin"],
  [ROUTES.ADMIN.ORG]: ["admin"],
  [ROUTES.ADMIN.TEMPLATES]: ["admin"],
  [ROUTES.ADMIN.AUDIT_LOGS]: ["admin"],
  [ROUTES.ADMIN.AI_CONFIG]: ["admin"],
};

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  section: string;
  requiredRole?: Role;
  requiredPermission?: string;
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// Build the nav tree with explicit permission/role gates
export function buildNavTree(role: Role | null): NavSection[] {
  const allSections: NavSection[] = [
    {
      label: "Main",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          path: ROUTES.DASHBOARD.ROOT,
          section: "Main",
        },
      ],
    },
    {
      label: "Compliance",
      items: [
        {
          label: "Obligations",
          icon: ShieldCheck,
          path: ROUTES.OBLIGATIONS.LIST,
          section: "Compliance",
          requiredPermission: "compliance:read",
          children: [
            {
              label: "All Obligations",
              icon: List,
              path: ROUTES.OBLIGATIONS.LIST,
              section: "Compliance",
              requiredPermission: "compliance:read",
            },
            {
              label: "Create",
              icon: PlusCircle,
              path: ROUTES.OBLIGATIONS.CREATE,
              section: "Compliance",
              requiredPermission: "compliance:create",
            },
            {
              label: "History",
              icon: History,
              path: ROUTES.OBLIGATIONS.HISTORY,
              section: "Compliance",
              requiredPermission: "compliance:read",
            },
          ],
        },
        {
          label: "Corrective Actions",
          icon: ClipboardList,
          path: ROUTES.CAP.DASHBOARD,
          section: "Compliance",
          requiredPermission: "cap:read",
          children: [
            {
              label: "All CAPs",
              icon: List,
              path: ROUTES.CAP.LIST,
              section: "Compliance",
              requiredPermission: "cap:read",
            },
            {
              label: "Create CAP",
              icon: PlusCircle,
              path: ROUTES.CAP.CREATE,
              section: "Compliance",
              requiredPermission: "cap:create",
            },
          ],
        },
        {
          label: "Regulations",
          icon: BookOpen,
          path: ROUTES.REGULATION.LIBRARY,
          section: "Compliance",
          requiredPermission: "regulation:read",
          children: [
            {
              label: "Library",
              icon: List,
              path: ROUTES.REGULATION.LIBRARY,
              section: "Compliance",
              requiredPermission: "regulation:read",
            },
            {
              label: "Create",
              icon: PlusCircle,
              path: ROUTES.REGULATION.CREATE,
              section: "Compliance",
              requiredPermission: "regulation:create",
            },
          ],
        },
        {
          label: "Assignments",
          icon: ClipboardCheck,
          path: ROUTES.ASSIGNMENTS.LIST,
          section: "Compliance",
          requiredPermission: "assignment:read",
          children: [
            {
              label: "All Assignments",
              icon: List,
              path: ROUTES.ASSIGNMENTS.LIST,
              section: "Compliance",
              requiredPermission: "assignment:read",
            },
            {
              label: "Create Assignment",
              icon: PlusCircle,
              path: ROUTES.ASSIGNMENTS.CREATE,
              section: "Compliance",
              requiredPermission: "assignment:create",
            },
          ],
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          label: "Reports",
          icon: BarChart3,
          path: ROUTES.REPORTS.EXECUTIVE,
          section: "Management",
          requiredPermission: "report:read",
        },
      ],
    },
    {
      label: "Admin",
      items: [
        {
          label: "Administration",
          icon: Settings2,
          path: ROUTES.ADMIN.USERS,
          section: "Admin",
          requiredRole: "admin",
          children: [
            {
              label: "Users",
              icon: Users,
              path: ROUTES.ADMIN.USERS,
              section: "Admin",
              requiredRole: "admin",
            },
            {
              label: "Roles",
              icon: UserCog,
              path: ROUTES.ADMIN.ROLES,
              section: "Admin",
              requiredRole: "admin",
            },
            {
              label: "Organization",
              icon: Building2,
              path: ROUTES.ADMIN.ORG,
              section: "Admin",
              requiredRole: "admin",
            },
            {
              label: "Templates",
              icon: LayoutTemplate,
              path: ROUTES.ADMIN.TEMPLATES,
              section: "Admin",
              requiredRole: "admin",
            },
            {
              label: "Audit Logs",
              icon: ScrollText,
              path: ROUTES.ADMIN.AUDIT_LOGS,
              section: "Admin",
              requiredRole: "admin",
            },
            {
              label: "AI Config",
              icon: BrainCircuit,
              path: ROUTES.ADMIN.AI_CONFIG,
              section: "Admin",
              requiredRole: "admin",
            },
          ],
        },
      ],
    },
    {
      label: "Preferences",
      items: [
        {
          label: "Settings",
          icon: Settings,
          path: ROUTES.SETTINGS,
          section: "Preferences",
        },
      ],
    },
  ];

  return allSections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => filterNavItem(item, role))
        .filter((item): item is NavItem => item !== null),
    }))
    .filter((section) => section.items.length > 0);
}

function filterNavItem(item: NavItem, role: Role | null): NavItem | null {
  if (item.requiredRole && !hasMinimumRole(role, item.requiredRole))
    return null;
  if (item.requiredPermission && !hasPermission(role, item.requiredPermission))
    return null;

  const filteredChildren = item.children
    ?.map((child) => filterNavItem(child, role))
    .filter((child): child is NavItem => child !== null);

  return {
    ...item,
    children: filteredChildren,
  };
}

export function getNavItemsForRole(role: Role | null): NavSection[] {
  return buildNavTree(role);
}

export function isRouteAllowed(path: string, role: Role | null): boolean {
  const allowed = ROUTE_PERMISSIONS[path];
  if (!allowed) return true;
  if (!role) return false;
  return allowed.includes(role);
}
