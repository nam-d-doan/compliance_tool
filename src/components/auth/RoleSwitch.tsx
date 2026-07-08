import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useSidebar } from "@/components/ui/sidebar";
import type { Role } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, UserCircle, Check } from "lucide-react";

const ROLES: Role[] = ["admin", "executive", "owner", "approver", "reviewer"];

const ROLE_COLORS: Record<Role, string> = {
  admin:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  executive: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  owner:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  approver: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  reviewer: "bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300",
};

// Mirrors src/pages/dashboard/DashboardRedirect so a role switch immediately
// routes the user to the dashboard that matches their new role.
const ROLE_DASHBOARD: Record<Role, string> = {
  admin: "/dashboard/admin",
  executive: "/dashboard/executive",
  owner: "/dashboard/owner",
  approver: "/dashboard/approver",
  reviewer: "/dashboard/reviewer",
};

interface RoleSwitchProps {
  /**
   * - "default": full sidebar-footer trigger. Icon-only when the sidebar is
   *   collapsed (icon mode); icon + role badge + chevron when expanded.
   *   Clicking opens a dropdown of roles.
   * - "compact": bare list of role items meant to be rendered inside a parent
   *   menu's submenu content (used by TopNav's "Switch role" submenu). Renders
   *   NO trigger and NO nested menu of its own.
   */
  variant?: "default" | "compact";
}

export function RoleSwitch({ variant = "default" }: RoleSwitchProps) {
  const { user, role, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const currentRole = role ?? "reviewer";

  const handleRoleChange = (newRole: Role) => {
    updateUser({ role: newRole });
    // Refresh the whole view so it reflects the new role immediately.
    navigate(ROLE_DASHBOARD[newRole], { replace: true });
  };

  const renderRoleItems = () =>
    ROLES.map((r) => (
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
    ));

  // Bare items for use inside a parent menu's submenu (TopNav "Switch role").
  if (variant === "compact") {
    return <>{renderRoleItems()}</>;
  }

  const collapsed = state === "collapsed";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              "h-auto w-full justify-start gap-2 px-2 py-1.5",
              collapsed && "size-8 justify-center p-0",
            )}
            title={collapsed ? `Switch role (${currentRole})` : undefined}
            aria-label="Switch role"
          />
        }
      >
        <UserCircle className="size-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left text-xs font-medium text-muted-foreground">
              Role
            </span>
            <Badge
              variant="outline"
              className={cn(
                "border-transparent px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide",
                ROLE_COLORS[currentRole],
              )}
            >
              {currentRole}
            </Badge>
            <ChevronDown className="size-3 shrink-0 opacity-50" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        // When the sidebar is collapsed the footer is at the screen edge, so
        // float the menu out to the right; otherwise pop it above the footer.
        side={collapsed ? "right" : "top"}
        align={collapsed ? "center" : "start"}
        sideOffset={collapsed ? 8 : 4}
        className="min-w-44"
      >
        <DropdownMenuLabel>Switch role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {renderRoleItems()}
        {user && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
