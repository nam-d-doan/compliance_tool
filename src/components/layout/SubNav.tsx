import { NavLink, Outlet } from "react-router-dom";
import { Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Only active on this exact path (e.g. a library whose sub-pages have their own item). */
  end?: boolean;
  /** Key feature — shown with a star so it stands out in the demo. */
  highlight?: boolean;
  /** Tooltip, e.g. the RFQ wording. */
  title?: string;
}

/**
 * Glassy sub-navigation shared by the grouped areas (Administration, Reports,
 * Legal Updates, Issues & CAPs …). Same frosted-pill treatment as the main
 * TopNav so each area feels like one surface.
 */
export function SubNav({ items }: { items: SubNavItem[] }) {
  return (
    <nav className="flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-[16px] border bg-[var(--nav-bg)] px-2 py-1 shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map(({ label, icon: Icon, path, end, highlight, title }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          title={title ?? label}
          className={({ isActive }) =>
            cn(
              "flex min-w-[2rem] shrink-0 items-center justify-center gap-1.5 rounded-[7px] px-2.5 py-1.5 font-heading text-xs whitespace-nowrap transition-all",
              isActive
                ? "bg-chart-accent/85 font-bold text-black border border-white/50 backdrop-blur-md shadow-[0_6px_14px_-4px_rgb(0_0_0/0.22),0_2px_4px_-2px_rgb(0_0_0/0.14)]"
                : "font-semibold text-muted-foreground border border-transparent hover:bg-muted/50 hover:text-foreground",
              highlight && !isActive && "text-violet-600 dark:text-violet-300",
            )
          }
        >
          <Icon className="size-3.5" />
          <span>{label}</span>
          {highlight && (
            <Star className="size-3 fill-amber-400 text-amber-400" />
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** Route wrapper: the area's sub-navigation above the page. */
export function SubNavLayout({ items }: { items: SubNavItem[] }) {
  return (
    <div className="space-y-5">
      <SubNav items={items} />
      <Outlet />
    </div>
  );
}
