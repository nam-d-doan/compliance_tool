import {
  Users,
  UserCog,
  Building2,
  ScrollText,
  BrainCircuit,
  Grid3x3,
  Siren,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { SubNav, type SubNavItem } from "@/components/layout/SubNav";

const ITEMS: SubNavItem[] = [
  { label: "Users", icon: Users, path: ROUTES.ADMIN.USERS },
  { label: "Roles", icon: UserCog, path: ROUTES.ADMIN.ROLES },
  { label: "Organization", icon: Building2, path: ROUTES.ADMIN.ORG },
  { label: "Risk Matrix", icon: Grid3x3, path: ROUTES.ADMIN.RISK_MATRIX },
  {
    label: "Escalation Rules",
    icon: Siren,
    path: ROUTES.ADMIN.ESCALATION_RULES,
  },
  { label: "Audit Logs", icon: ScrollText, path: ROUTES.ADMIN.AUDIT_LOGS },
  { label: "AI Config", icon: BrainCircuit, path: ROUTES.ADMIN.AI_CONFIG },
];

/**
 * Sub-navigation for the Administration area, so users can jump between
 * Users / Roles / Organization / Audit Logs / AI Config without going back to
 * the top nav.
 */
export function AdminSubNav() {
  return <SubNav items={ITEMS} />;
}
