import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useThemeStore } from "@/stores";
import { AuthService } from "@/services/auth_service";
import { useNotifications } from "@/hooks/queries";
import { getNavPillsForRole } from "@/constants/navPills";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
      <header className="relative z-50 flex flex-wrap items-center gap-3.5 px-4 pt-4 sm:px-6">
        <Link to={ROUTES.DASHBOARD.ROOT} className="flex shrink-0 items-center gap-2">
          <div className="bg-ink-chip flex size-[26px] items-center justify-center rounded-[7px]">
            <span className="text-chart-accent font-heading text-[11px] font-extrabold">
              CA
            </span>
          </div>
          <span className="font-heading text-sm font-bold whitespace-nowrap">
            ComplianceAI
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 justify-center">
          <nav className="flex max-w-full flex-wrap items-center gap-1.5 rounded-[18px] border bg-[var(--nav-bg)] px-3 py-1.5 shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]">
            {pills.map((pill) => {
              const isActive =
                location.pathname === pill.path ||
                pill.matchPrefixes?.some((p) =>
                  location.pathname.startsWith(p),
                );
              return (
                <Link
                  key={pill.key}
                  to={pill.path}
                  title={pill.label}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-[9px] px-3 py-[7px] font-heading text-xs whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-card font-bold text-foreground shadow-sm"
                      : "font-semibold text-muted-foreground hover:text-foreground",
                  )}
                >
                  <pill.icon className="size-3.5" />
                  <span>{pill.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-2.5">
          <div
            className={cn(
              "flex h-[38px] items-center gap-2 overflow-hidden rounded-[19px] border bg-[var(--nav-bg)] px-3 shadow-[var(--card-shadow)] backdrop-blur-xl transition-[width] duration-200 [border-color:var(--nav-border)]",
              searchOpen ? "w-[220px]" : "w-[38px]",
            )}
          >
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="shrink-0 text-muted-foreground"
              aria-label="Search"
            >
              <Search className="size-[15px]" />
            </button>
            {searchOpen && (
              <Input
                autoFocus
                placeholder="Search obligations, regulations…"
                className="h-auto border-none bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notifications"
            className="relative flex size-[38px] shrink-0 items-center justify-center rounded-full border bg-[var(--nav-bg)] shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]"
          >
            <Bell
              className={cn("size-[15px]", notificationCount > 0 && "animate-shake")}
            />
            {notificationCount > 0 && (
              <span className="bg-danger absolute -top-1 -right-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-[3px] text-[9.5px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>

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
            <DropdownMenuTrigger
              className="flex h-[38px] shrink-0 items-center gap-2.5 rounded-[19px] border bg-[var(--nav-bg)] py-1 pr-1.5 pl-3.5 shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]"
            >
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
    </>
  );
}
