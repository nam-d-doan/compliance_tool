import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  FileStack,
  LayoutDashboard,
  ListChecks,
  Radar,
  ScrollText,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { Role } from "@/types";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";

export interface SideNavChild {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Extra route prefixes that also highlight this entry. */
  matchPrefixes?: string[];
  roles?: Role[];
}

export interface SideNavItem {
  key: string;
  label: string;
  /** Module number shown before the label (1–3 = the RFQ CMS modules). */
  module?: number;
  icon: LucideIcon;
  path: string;
  matchPrefixes?: string[];
  requiredPermission?: string;
  roles?: Role[];
  children?: SideNavChild[];
}

/**
 * Left side menu: Dashboard, the three CMS modules (RFQ Phụ lục 1 groups
 * 1–3), Reports and Administration. Detail pages keep their own addresses and
 * highlight their module through `matchPrefixes`.
 */
export const SIDE_NAV: SideNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD.ROOT,
    matchPrefixes: ["/dashboard"],
  },
  {
    key: "library",
    label: "Document Library",
    module: 1,
    icon: BookOpen,
    path: ROUTES.LIBRARY,
    requiredPermission: "legal:read",
    children: [
      {
        label: "Search documents",
        icon: BookOpen,
        path: ROUTES.LIBRARY,
        matchPrefixes: [
          "/library",
          "/legal-updates",
          "/qdnb",
          "/regulation",
          "/legal-mapping",
        ],
      },
      {
        label: "Compliance obligations",
        icon: ShieldCheck,
        path: ROUTES.OBLIGATIONS.LIST,
        matchPrefixes: ["/obligations"],
      },
    ],
  },
  {
    key: "tasks",
    label: "Task Management",
    module: 2,
    icon: ListChecks,
    path: ROUTES.TASKS.LIST,
    requiredPermission: "qdnb:read",
    children: [
      {
        label: "Task list",
        icon: ListChecks,
        path: ROUTES.TASKS.LIST,
        matchPrefixes: ["/tasks", "/assignment"],
      },
      {
        label: "Late-issuance alerts",
        icon: AlarmClock,
        path: ROUTES.REPORTS.LATE_ISSUANCE,
      },
    ],
  },
  {
    key: "issues",
    label: "Compliance Issues",
    module: 3,
    icon: ShieldAlert,
    path: ROUTES.NCC.LIST,
    requiredPermission: "ncc:read",
    children: [
      {
        label: "Issue list",
        icon: ShieldAlert,
        path: ROUTES.NCC.LIST,
        matchPrefixes: ["/ncc/list", "/ncc/create", "/ncc/", "/cap"],
      },
      { label: "Escalations", icon: Siren, path: ROUTES.NCC.ESCALATIONS },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    path: ROUTES.REPORTS.EXECUTIVE,
    requiredPermission: "report:read",
    children: [
      {
        label: "Executive Summary",
        icon: Sparkles,
        path: ROUTES.REPORTS.EXECUTIVE,
      },
      {
        label: "Periodic Reports",
        icon: FileStack,
        path: ROUTES.REPORTS.PERIODIC,
      },
      {
        label: "Internal Control Issues",
        icon: ShieldCheck,
        path: ROUTES.REPORTS.INTERNAL_CONTROL,
      },
      { label: "Early Warning", icon: Radar, path: ROUTES.REPORTS.EWS },
      { label: "Status", icon: BarChart3, path: ROUTES.REPORTS.STATUS },
      { label: "CAP", icon: ClipboardList, path: ROUTES.REPORTS.CAP },
      { label: "Calendar", icon: Calendar, path: ROUTES.REPORTS.CALENDAR },
      {
        label: "Audit Trail",
        icon: ScrollText,
        path: ROUTES.REPORTS.AUDIT_TRAIL,
        roles: ["executive", "admin"],
      },
    ],
  },
  {
    key: "admin",
    label: "Administration",
    icon: Settings2,
    path: ROUTES.ADMIN.USERS,
    matchPrefixes: ["/admin"],
    roles: ["admin"],
    children: [
      {
        label: "Users & roles",
        icon: Settings2,
        path: ROUTES.ADMIN.USERS,
        matchPrefixes: [
          "/admin/users",
          "/admin/roles",
          "/admin/organization",
          "/admin/risk-matrix",
          "/admin/escalation-rules",
          "/admin/audit-logs",
          "/admin/ai-config",
        ],
      },
      {
        label: "Task workflow setup",
        icon: Workflow,
        path: ROUTES.ADMIN.TASK_WORKFLOW,
      },
    ],
  },
];

export function getSideNavForRole(role: Role | null): SideNavItem[] {
  const allowed = (roles?: Role[]) =>
    !roles || (!!role && roles.includes(role));
  return SIDE_NAV.filter(
    (item) =>
      allowed(item.roles) &&
      (!item.requiredPermission ||
        hasPermission(role, item.requiredPermission)),
  ).map((item) => ({
    ...item,
    children: item.children?.filter((c) => allowed(c.roles)),
  }));
}

/** Longest-prefix match so "/ncc/escalations" lights up Escalations, not Issue list. */
export function activeSideNav(
  items: SideNavItem[],
  pathname: string,
): { item?: string; child?: string } {
  let best: { item: string; child?: string; len: number } | undefined;
  const consider = (p: string, item: string, child?: string) => {
    if (pathname.startsWith(p) && (!best || p.length > best.len))
      best = { item, child, len: p.length };
  };
  for (const item of items) {
    for (const p of [item.path, ...(item.matchPrefixes ?? [])])
      consider(p, item.key);
    for (const c of item.children ?? [])
      for (const p of [c.path, ...(c.matchPrefixes ?? [])])
        consider(p, item.key, c.path);
  }
  return { item: best?.item, child: best?.child };
}

/** How each demo role is presented (the three CMS user flows + leadership). */
export const ROLE_DISPLAY: Record<Role, { label: string; hint: string }> = {
  owner: { label: "Compliance (CMS owner)", hint: "Bộ phận Tuân thủ" },
  approver: { label: "Department", hint: "Khối Công nghệ thông tin" },
  admin: { label: "System admin", hint: "Quản trị hệ thống" },
  executive: { label: "Executive", hint: "Ban lãnh đạo" },
};

/** The department the demo "Department" login (approver role) belongs to. */
export const DEPARTMENT_USER_UNIT = {
  id: "dept-it",
  name: "Khối Công nghệ thông tin",
};
