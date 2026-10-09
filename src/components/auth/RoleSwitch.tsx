import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import type { Role } from "@/types";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserCircle, Check } from "lucide-react";
import { useTerm } from "@/lib/i18n";
import { DEMO_USERS } from "@/constants/demo-users";

const ROLES: Role[] = ["admin", "executive", "owner", "approver"];

// Mirrors src/pages/dashboard/DashboardRedirect so a role switch immediately
// routes the user to the dashboard that matches their new role.
const ROLE_DASHBOARD: Record<Role, string> = {
  admin: "/dashboard/admin",
  executive: "/dashboard/executive",
  owner: "/dashboard/owner",
  approver: "/dashboard/approver",
};

/**
 * Bare list of role items meant to be rendered inside a parent menu's
 * submenu content (TopNav's "Switch role" submenu). Renders no trigger and
 * no nested menu of its own.
 *
 * Switching role signs in as that role's demo account (not just a role flip on
 * the current user): views scoped by user id — e.g. LM "My Cases" — and the
 * audit trail would otherwise show the previous person's data/name.
 */
export function RoleSwitch() {
  const { role, login } = useAuthStore();
  const term = useTerm();
  const navigate = useNavigate();
  const currentRole = role ?? "approver";

  const handleRoleChange = (newRole: Role) => {
    const demoUser = DEMO_USERS.find((u) => u.role === newRole);
    if (demoUser) {
      // Same token shape as the mock auth handler / MFAForm.
      login(
        {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          isActive: demoUser.isActive,
          createdAt: demoUser.createdAt,
          updatedAt: demoUser.updatedAt,
        },
        `fake-jwt-${demoUser.id}-${Date.now()}`,
      );
    }
    navigate(ROLE_DASHBOARD[newRole], { replace: true });
  };

  return (
    <>
      {ROLES.map((r) => {
        const demoUser = DEMO_USERS.find((u) => u.role === r);
        return (
          <DropdownMenuItem key={r} onClick={() => handleRoleChange(r)}>
            <UserCircle className="size-4 text-muted-foreground" />
            <span className="flex flex-1 flex-col">
              <span>{term(r)}</span>
              {demoUser && (
                <span className="text-xs text-muted-foreground">{demoUser.name}</span>
              )}
            </span>
            {r === currentRole && (
              <Check className="size-4 text-primary" aria-label="active role" />
            )}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
