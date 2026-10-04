import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useThemeStore } from "@/stores";
import { AuthService } from "@/services/auth_service";
import { useCmsOverview, useNotifications } from "@/hooks/queries";
import { DemoClock, GlobalSearch } from "@/components/cms";
import { activePillKey, getNavPillsForRole } from "@/constants/navPills";
import { LanguageSwitch } from "./LanguageSwitch";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { NotificationDrawer } from "./NotificationDrawer";
import { RoleSwitch } from "@/components/auth/RoleSwitch";
import { useTabActionCounts } from "@/hooks/useTabActionCounts";
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  Sparkles,
  Shield,
  Settings2,
} from "lucide-react";

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: unreadData } = useNotifications(1, 1, { read: false });
  const notificationCount = unreadData?.total ?? 0;
  const isAdmin = role === "admin";
  const isAdminRoute = location.pathname.startsWith("/admin");

  const pills = getNavPillsForRole(role);
  const activeKey = activePillKey(pills, location.pathname);
  const tabCounts = useTabActionCounts();
  const { data: cms } = useCmsOverview();

  // Ctrl/Cmd + K opens the repository search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pillCount = (key: string): number => {
    switch (key) {
      // Grouped tabs add up the items of every page in their sub-menu.
      case "legal":
        return (cms?.legalUpdates.unread ?? 0) + tabCounts.assignments;
      case "qdnb":
        return cms?.revisions.overdue ?? 0;
      case "regulations":
        return tabCounts.regulations + tabCounts.obligations;
      case "issues":
        return tabCounts.nccs + tabCounts.caps;
      default:
        return 0;
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (user?.email?.[0].toUpperCase() ?? "U");

  return (
    <>
      <header className="relative z-50 flex items-center gap-3.5 px-4 pt-4 sm:px-6">
        <Link
          to={ROUTES.DASHBOARD.ROOT}
          className="flex shrink-0 items-center gap-2"
        >
          <div className="bg-ink-chip flex size-[26px] items-center justify-center rounded-[7px]">
            <span className="text-chart-accent font-heading text-[11px] font-extrabold">
              EY
            </span>
          </div>
          <span className="font-heading text-sm font-bold whitespace-nowrap">
            Compliance Tool
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 justify-center">
          <nav className="relative flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[18px] border bg-[var(--nav-bg)] px-2.5 py-1.5 shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pills.map((pill) => {
              const isActive = pill.key === activeKey;
              return (
                <Link
                  key={pill.key}
                  to={pill.path}
                  title={pill.label}
                  className={cn(
                    "flex min-w-[2rem] shrink-0 items-center justify-center gap-1.5 rounded-[9px] px-2.5 py-[7px] font-heading text-xs whitespace-nowrap transition-all",
                    isActive
                      ? "bg-chart-accent/85 font-bold text-black border border-white/50 backdrop-blur-md shadow-[0_8px_20px_-4px_rgb(2_0_0/0.25),0_3px_6px_-2px_rgb(0_0_0/0.15)]"
                      : "font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent",
                  )}
                >
                  <pill.icon className="size-3.5" />
                  {/* On cramped widths, hide the label for inactive tabs; keep
                      it for the active tab so the current location is obvious. */}
                  <span
                    className={isActive ? "inline" : "hidden xl:inline"}
                    data-vi={pill.labelVi}
                  >
                    {pill.label}
                  </span>
                  {(() => {
                    const count = pillCount(pill.key);
                    if (count <= 0) return null;
                    return (
                      <span
                        className="bg-danger flex h-[14px] min-w-[14px] shrink-0 items-center justify-center rounded-full px-[3px] text-[9px] font-bold text-white"
                        aria-label={`${count} item${count === 1 ? "" : "s"} need${count === 1 ? "s" : ""} your attention`}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    );
                  })()}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search (Ctrl+K)"
            title="Search laws, QĐNB and issues (Ctrl+K)"
            className="flex size-[38px] shrink-0 items-center justify-center rounded-full border bg-[var(--nav-bg)] text-muted-foreground shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]"
          >
            <Search className="size-[15px]" />
          </button>

          <DemoClock />

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notifications"
            className="relative flex size-[38px] shrink-0 items-center justify-center rounded-full border bg-[var(--nav-bg)] shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]"
          >
            <Bell
              className={cn(
                "size-[15px]",
                notificationCount > 0 && "animate-shake",
              )}
            />
            {notificationCount > 0 && (
              <span className="bg-danger absolute -top-1 -right-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-[3px] text-[9.5px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>

          <LanguageSwitch />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex size-[38px] shrink-0 items-center justify-center rounded-full border bg-[var(--nav-bg)] shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]"
          >
            {theme === "dark" ? (
              <Moon className="size-[15px]" />
            ) : (
              <Sun className="size-[15px]" />
            )}
          </button>

          {isAdmin && (
            <Link
              to={ROUTES.ADMIN.USERS}
              aria-label="Administration"
              title="Administration"
              className={cn(
                "flex size-[38px] shrink-0 items-center justify-center rounded-full border shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]",
                isAdminRoute ? "bg-primary" : "bg-[var(--nav-bg)]",
              )}
            >
              <Settings2
                className={cn(
                  "size-[15px]",
                  isAdminRoute && "text-primary-foreground",
                )}
              />
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-[38px] shrink-0 items-center gap-2.5 rounded-[19px] border bg-[var(--nav-bg)] py-1 pr-3 pl-3.5 shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]">
              <div className="bg-ink-chip flex size-7 shrink-0 items-center justify-center rounded-full">
                <span className="text-ink-chip-foreground text-[11px] font-bold">
                  {initials}
                </span>
              </div>
              <div className="hidden flex-col items-start leading-[1.15] md:flex">
                <span className="text-xs font-bold whitespace-nowrap">
                  {user?.name ?? user?.email ?? "Guest"}
                </span>
                <span className="text-[10.5px] whitespace-nowrap text-muted-foreground capitalize">
                  {role ?? "Guest"}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name ?? "Guest"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(ROUTES.PROFILE)}
                className="cursor-pointer"
              >
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(ROUTES.SETTINGS)}
                className="cursor-pointer"
              >
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => navigate(ROUTES.ADMIN.USERS)}
                  className="cursor-pointer"
                >
                  <Shield className="mr-2 size-4" />
                  Administration
                </DropdownMenuItem>
              )}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sparkles className="mr-2 size-4" />
                  Switch Role
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <RoleSwitch />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <NotificationDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
