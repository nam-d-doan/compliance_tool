import { useAuthStore } from "@/stores";
import type { Role } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, UserCircle } from "lucide-react";

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

interface RoleSwitchProps {
  variant?: "default" | "compact";
}

export function RoleSwitch({ variant = "default" }: RoleSwitchProps) {
  const { user, role, updateUser } = useAuthStore();
  const currentRole = role ?? "reviewer";

  const handleRoleChange = (newRole: Role) => {
    updateUser({ role: newRole });
  };

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="sm" className="gap-1 px-2">
            <UserCircle className="size-4" />
            <span className="capitalize">{currentRole}</span>
            <ChevronDown className="size-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ROLES.map((r) => (
            <DropdownMenuItem
              key={r}
              onClick={() => handleRoleChange(r)}
              className="capitalize"
            >
              {r}
              {r === currentRole && (
                <span className="ml-auto text-xs text-primary">active</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Demo role
        </span>
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold uppercase tracking-wide ${ROLE_COLORS[currentRole]}`}
        >
          {currentRole}
        </Badge>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <UserCircle className="size-4" />
              <span className="capitalize">{currentRole}</span>
            </span>
            <ChevronDown className="size-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {ROLES.map((r) => (
            <DropdownMenuItem
              key={r}
              onClick={() => handleRoleChange(r)}
              className="capitalize"
            >
              {r}
              {r === currentRole && (
                <span className="ml-auto text-xs text-primary">active</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {user && (
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      )}
    </div>
  );
}
