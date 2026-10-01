import type { Role } from "@/types";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  ClipboardList,
  ShieldAlert,
  BarChart3,
  Gavel,
} from "lucide-react";

export interface NavPill {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  /** Route prefixes that should also highlight this pill as active. */
  matchPrefixes?: string[];
  requiredPermission?: string;
}

export const NAV_PILLS: NavPill[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD.ROOT,
    matchPrefixes: ["/dashboard"],
  },
  {
    key: "regulations",
    label: "Regulations",
    icon: BookOpen,
    path: ROUTES.REGULATION.LIBRARY,
    matchPrefixes: ["/regulation"],
    requiredPermission: "regulation:read",
  },
  {
    key: "assignments",
    label: "Assignments",
    icon: ClipboardCheck,
    path: ROUTES.ASSIGNMENTS.LIST,
    matchPrefixes: ["/assignment"],
    requiredPermission: "assignment:read",
  },
  {
    key: "obligations",
    label: "Obligations",
    icon: ShieldCheck,
    path: ROUTES.OBLIGATIONS.LIST,
    matchPrefixes: ["/obligations"],
    requiredPermission: "compliance:read",
  },
  {
    key: "cap",
    label: "CAPs",
    icon: ClipboardList,
    path: ROUTES.CAP.LIST,
    matchPrefixes: ["/cap"],
    requiredPermission: "cap:read",
  },
  {
    key: "ncc",
    label: "NCC",
    icon: ShieldAlert,
    path: ROUTES.NCC.LIST,
    matchPrefixes: ["/ncc"],
    requiredPermission: "ncc:read",
  },
  {
    key: "lm",
    label: "Tố tụng",
    icon: Gavel,
    path: ROUTES.LM.DASHBOARD,
    matchPrefixes: ["/lm"],
    requiredPermission: "lm:read",
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    path: ROUTES.REPORTS.EXECUTIVE,
    matchPrefixes: ["/reports"],
    requiredPermission: "report:read",
  },
];

export function getNavPillsForRole(role: Role | null): NavPill[] {
  return NAV_PILLS.filter(
    (pill) =>
      !pill.requiredPermission || hasPermission(role, pill.requiredPermission),
  );
}
