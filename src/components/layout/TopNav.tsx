import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useThemeStore, useCopilotStore } from "@/stores";
import { AuthService } from "@/services/auth_service";
import { useAssignmentList } from "@/hooks/queries";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationDrawer } from "./NotificationDrawer";
import { NeedsCapNavButton } from "./NeedsCapNavButton";
import { RoleSwitch } from "@/components/auth/RoleSwitch";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  Settings,
  Sparkles,
  HelpCircle,
  PanelLeftIcon,
  ClipboardCheck,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { open: openCopilot } = useCopilotStore();
  const { toggleSidebar, isMobile } = useSidebar();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationCount = 4;

  // Count of published assignments awaiting acknowledgment (badge source)
  const { data: pendingAssignments } = useAssignmentList(
    { status: "published" },
    1,
    1,
  );
  const pendingAssignmentCount = pendingAssignments?.total ?? 0;

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
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 shadow-sm">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="shrink-0"
          aria-label="Toggle sidebar"
        >
          {isMobile ? (
            <Menu className="size-5" />
          ) : (
            <PanelLeftIcon className="size-5" />
          )}
        </Button>

        <div className="relative hidden flex-1 max-w-md md:block">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search obligations, regulations, CAPs..."
            className="h-9 w-full rounded-md border-border bg-muted/50 pl-9 pr-4 text-sm focus:bg-background"
            onFocus={() => {
              // Command palette stub for Phase 5
              // eslint-disable-next-line no-console
              console.log("Global search focused");
            }}
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:flex">
            ⌘K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:flex"
            aria-label="AI Copilot"
            onClick={openCopilot}
          >
            <Sparkles className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Help"
            className="hidden sm:flex"
          >
            <HelpCircle className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="size-5" />
            ) : (
              <Sun className="size-5" />
            )}
          </Button>

          <NeedsCapNavButton />

          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label="Assignments"
            onClick={() => navigate(ROUTES.ASSIGNMENTS.LIST)}
          >
            <ClipboardCheck className="size-5" />
            {pendingAssignmentCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
              >
                {pendingAssignmentCount > 9 ? "9+" : pendingAssignmentCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="size-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" className="gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate text-sm font-medium lg:inline">
                  {user?.name ?? user?.email ?? "Guest"}
                </span>
              </Button>
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
                onClick={() => navigate("/profile")}
                className="cursor-pointer"
              >
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sparkles className="mr-2 size-4" />
                  Switch Role
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <RoleSwitch variant="compact" />
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
