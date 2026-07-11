import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import type { Role } from "@/types";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserCircle, Check } from "lucide-react";

const ROLES: Role[] = ["admin", "executive", "owner", "approver", "reviewer"];

// Mirrors src/pages/dashboard/DashboardRedirect so a role switch immediately
// routes the user to the dashboard that matches their new role.
const ROLE_DASHBOARD: Record<Role, string> = {
  admin: "/dashboard/admin",
  executive: "/dashboard/executive",
  owner: "/dashboard/owner",
  approver: "/dashboard/approver",
  reviewer: "/dashboard/reviewer",
};

/**
 * Bare list of role items meant to be rendered inside a parent menu's
 * submenu content (TopNav's "Switch role" submenu). Renders no trigger and
 * no nested menu of its own.
 */
export function RoleSwitch() {
  const { role, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const currentRole = role ?? "reviewer";

  const handleRoleChange = (newRole: Role) => {
    updateUser({ role: newRole });
    navigate(ROLE_DASHBOARD[newRole], { replace: true });
  };

  return (
    <>
      {ROLES.map((r) => (
        <DropdownMenuItem
          key={r}
          onClick={() => handleRoleChange(r)}
          className="capitalize"
        >
          <UserCircle className="size-4 text-muted-foreground" />
          <span className="flex-1">{r}</span>
          {r === currentRole && (
            <Check className="size-4 text-primary" aria-label="active role" />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}
