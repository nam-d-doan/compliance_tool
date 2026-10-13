import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useCmsOverview } from "@/hooks/queries";
import {
  activeSideNav,
  getSideNavForRole,
  ROLE_DISPLAY,
} from "@/constants/sideNav";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * Left side menu (replaces the top pill bar). Same frosted surface and accent
 * as the original navigation; the active module expands to show its pages.
 */
export function SideNav({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const role = useAuthStore((s) => s.role);
  const items = getSideNavForRole(role);
  const active = activeSideNav(items, pathname);
  const { data: cms } = useCmsOverview();

  const badge = (key: string): number => {
    switch (key) {
      case "library":
        return cms?.legalUpdates.unread ?? 0;
      case "tasks":
        return cms?.revisions.overdue ?? 0;
      case "issues":
        return cms?.issues.escalationsAwaitingAck ?? 0;
      default:
        return 0;
    }
  };

  return (
    <aside
      className={cn(
        "flex w-[244px] shrink-0 flex-col gap-4 rounded-[20px] border bg-[var(--nav-bg)] p-3 shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]",
        className,
      )}
    >
      <Link
        to={ROUTES.DASHBOARD.ROOT}
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 pt-1"
      >
        <div className="bg-ink-chip flex size-[30px] items-center justify-center rounded-[8px]">
          <span className="text-chart-accent font-heading text-[11px] font-extrabold">
            EY
          </span>
        </div>
        <span className="flex flex-col leading-tight">
          <span className="font-heading text-sm font-bold">
            Compliance Tool
          </span>
          <span className="text-[10.5px] text-muted-foreground">
            CMS · Nam A Bank
          </span>
        </span>
      </Link>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:thin]">
        {items.map((item, idx) => {
          const isActive = active.item === item.key;
          const count = badge(item.key);
          const showDivider =
            idx > 0 && !item.module && !!items[idx - 1].module;
          return (
            <div key={item.key}>
              {showDivider && <div className="mx-2 my-2 h-px bg-border" />}
              <Link
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-[11px] border px-2.5 py-2 font-heading text-[13px] transition-all",
                  isActive
                    ? "bg-chart-accent/85 border-white/50 font-bold text-black shadow-[0_8px_20px_-6px_rgb(2_0_0/0.25)]"
                    : "border-transparent font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {item.module ? (
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold",
                      isActive
                        ? "bg-black/80 text-white"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {item.module}
                  </span>
                ) : (
                  <item.icon className="size-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {count > 0 && (
                  <span className="bg-danger flex h-[16px] min-w-[16px] shrink-0 items-center justify-center rounded-full px-[4px] text-[9.5px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
              {isActive && item.children && item.children.length > 1 && (
                <div className="mt-1 mb-1 ml-[19px] flex flex-col gap-0.5 border-l border-border pl-2">
                  {item.children.map((c) => {
                    const childActive = active.child === c.path;
                    return (
                      <Link
                        key={c.path}
                        to={c.path}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                          childActive
                            ? "bg-muted font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        <c.icon className="size-3.5 shrink-0" />
                        <span className="truncate">{c.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {role && (
        <div className="rounded-xl border border-dashed border-border px-3 py-2 text-[11px]">
          <p className="text-muted-foreground">Signed in as</p>
          <p className="font-semibold">{ROLE_DISPLAY[role].label}</p>
          <p className="text-muted-foreground" data-no-translate>
            {ROLE_DISPLAY[role].hint}
          </p>
        </div>
      )}
    </aside>
  );
}
