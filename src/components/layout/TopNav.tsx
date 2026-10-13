import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useThemeStore } from "@/stores";
import { AuthService } from "@/services/auth_service";
import { useNotifications } from "@/hooks/queries";
import { DemoClock, GlobalSearch } from "@/components/cms";
import { ROLE_DISPLAY } from "@/constants/sideNav";
import { SideNav } from "./SideNav";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
  Menu,
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

  const [menuOpen, setMenuOpen] = useState(false);

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
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex size-[38px] shrink-0 items-center justify-center rounded-full border bg-[var(--nav-bg)] shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)] lg:hidden"
        >
          <Menu className="size-[15px]" />
        </button>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-[38px] min-w-0 flex-1 items-center gap-2 rounded-full border bg-[var(--nav-bg)] px-4 text-left text-xs text-muted-foreground shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)] md:max-w-md"
        >
          <Search className="size-[15px] shrink-0" />
          <span className="truncate">Search laws, QĐNB, tasks and issues…</span>
          <kbd className="ml-auto hidden rounded border border-border px-1.5 font-mono text-[10px] sm:inline">
            Ctrl K
          </kbd>
        </button>
        <div className="hidden flex-1 md:block" />

        <div className="flex shrink-0 flex-nowrap items-center gap-2.5">
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
                <span className="text-[10.5px] whitespace-nowrap text-muted-foreground">
                  {role ? ROLE_DISPLAY[role].label : "Guest"}
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

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-[276px] border-none bg-transparent p-4 shadow-none"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SideNav className="h-full" onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <NotificationDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
