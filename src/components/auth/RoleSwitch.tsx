import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import type { Role } from "@/types";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserCircle, Check } from "lucide-react";
import { ROLE_DISPLAY } from "@/constants/sideNav";

const ROLES: Role[] = ["owner", "approver", "admin", "executive"];

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
 */
export function RoleSwitch() {
  const { role, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const currentRole = role ?? "approver";

  const handleRoleChange = (newRole: Role) => {
    updateUser({ role: newRole });
    navigate(ROLE_DASHBOARD[newRole], { replace: true });
  };

  return (
    <>
      {ROLES.map((r) => (
        <DropdownMenuItem key={r} onClick={() => handleRoleChange(r)}>
          <UserCircle className="size-4 text-muted-foreground" />
          <span className="flex flex-1 flex-col leading-tight">
            <span>{ROLE_DISPLAY[r].label}</span>
            <span
              className="text-[10.5px] text-muted-foreground"
              data-no-translate
            >
              {ROLE_DISPLAY[r].hint}
            </span>
          </span>
          {r === currentRole && (
            <Check className="size-4 text-primary" aria-label="active role" />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}
