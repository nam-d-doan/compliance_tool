import { NavLink } from "react-router-dom";
import { Users, UserCog, Building2, ScrollText, BrainCircuit } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface SubNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const ITEMS: SubNavItem[] = [
  { label: "Users", icon: Users, path: ROUTES.ADMIN.USERS },
  { label: "Roles", icon: UserCog, path: ROUTES.ADMIN.ROLES },
  { label: "Organization", icon: Building2, path: ROUTES.ADMIN.ORG },
  { label: "Audit Logs", icon: ScrollText, path: ROUTES.ADMIN.AUDIT_LOGS },
  { label: "AI Config", icon: BrainCircuit, path: ROUTES.ADMIN.AI_CONFIG },
];

/**
 * Glassy sub-navigation for the Administration area. Renders the same
 * frosted-pill treatment as the main TopNav so the admin section feels like
 * one surface, and lets users jump between Users / Roles / Organization /
 * Audit Logs / AI Config without going back to the top nav.
 */
export function AdminSubNav() {
  return (
    <nav className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[16px] border bg-[var(--nav-bg)] px-2 py-1 shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ITEMS.map(({ label, icon: Icon, path }) => (
        <NavLink
          key={path}
          to={path}
          title={label}
          className={({ isActive }) =>
            cn(
              "flex min-w-[2rem] shrink-0 items-center justify-center gap-1.5 rounded-[7px] px-2.5 py-1.5 font-heading text-xs whitespace-nowrap transition-all",
              isActive
                ? "bg-chart-accent/85 font-bold text-black border border-white/50 backdrop-blur-md shadow-[0_6px_14px_-4px_rgb(0_0_0/0.22),0_2px_4px_-2px_rgb(0_0_0/0.14)]"
                : "font-semibold text-muted-foreground border border-transparent hover:bg-muted/50 hover:text-foreground",
            )
          }
        >
          <Icon className="size-3.5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}