import type { Role } from "@/types";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  ShieldAlert,
  BarChart3,
  Newspaper,
  BookMarked,
} from "lucide-react";

export interface NavPill {
  key: string;
  label: string;
  /** Short Vietnamese label for the top menu (space is tight). */
  labelVi?: string;
  icon: LucideIcon;
  path: string;
  /** Route prefixes that should also highlight this pill as active. */
  matchPrefixes?: string[];
  requiredPermission?: string;
}

/**
 * Top menu. Related pages share one pill and are reached through the area's
 * sub-menu (see constants/subNavs.ts).
 */
export const NAV_PILLS: NavPill[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    labelVi: "Tổng quan",
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD.ROOT,
    matchPrefixes: ["/dashboard"],
  },
  {
    key: "legal",
    label: "Legal Updates",
    labelVi: "Cập nhật pháp lý",
    icon: Newspaper,
    path: ROUTES.LEGAL.LIST,
    matchPrefixes: ["/legal-updates", "/legal-mapping", "/assignment"],
    requiredPermission: "legal:read",
  },
  {
    key: "regulations",
    label: "Regulations",
    labelVi: "Văn bản",
    icon: BookOpen,
    path: ROUTES.REGULATION.LIBRARY,
    matchPrefixes: ["/regulation", "/obligations"],
    requiredPermission: "regulation:read",
  },
  {
    key: "qdnb",
    label: "Internal Regs (QĐNB)",
    labelVi: "Quy định nội bộ",
    icon: BookMarked,
    path: ROUTES.QDNB.LIST,
    matchPrefixes: ["/qdnb", "/reports/late-issuance"],
    requiredPermission: "qdnb:read",
  },
  {
    key: "issues",
    label: "Issues & CAPs",
    labelVi: "Vấn đề & Khắc phục",
    icon: ShieldAlert,
    path: ROUTES.NCC.LIST,
    matchPrefixes: ["/ncc", "/cap"],
    requiredPermission: "ncc:read",
  },
  {
    key: "reports",
    label: "Reports",
    labelVi: "Báo cáo",
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

/**
 * The single pill to highlight for a path: the one with the longest matching
 * prefix, so "/reports/late-issuance" lights up QĐNB rather than Reports.
 */
export function activePillKey(
  pills: NavPill[],
  pathname: string,
): string | undefined {
  let best: { key: string; len: number } | undefined;
  for (const pill of pills) {
    for (const p of [pill.path, ...(pill.matchPrefixes ?? [])]) {
      if (pathname.startsWith(p) && (!best || p.length > best.len)) {
        best = { key: pill.key, len: p.length };
      }
    }
  }
  return best?.key;
}
