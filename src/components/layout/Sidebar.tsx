import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores";
import {
  getNavItemsForRole,
  type NavItem,
  type NavSection,
} from "@/constants/routes";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { RoleSwitch } from "@/components/auth/RoleSwitch";
import { Shield } from "lucide-react";

function SidebarNavItem({ item }: { item: NavItem }) {
  const location = useLocation();
  const isActive =
    location.pathname === item.path ||
    location.pathname.startsWith(`${item.path}/`);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} tooltip={item.label}>
          <Link to={item.path} className="flex items-center gap-2">
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {item.children?.map((child) => (
            <SidebarMenuSubItem key={child.path}>
              <SidebarMenuSubButton isActive={location.pathname === child.path}>
                <Link to={child.path} className="flex items-center gap-2">
                  <child.icon className="size-4" />
                  <span>{child.label}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} tooltip={item.label}>
        <Link to={item.path} className="flex items-center gap-2">
          <item.icon className="size-4" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarSection({ section }: { section: NavSection }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <SidebarNavItem key={item.path} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { role } = useAuthStore();
  const sections = getNavItemsForRole(role);

  return (
    <SidebarRoot collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-2 py-3 transition-colors hover:text-primary"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="size-5" />
          </div>
          <span className="truncate text-base font-semibold tracking-tight">
            ComplianceAI
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarSection key={section.label} section={section} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <RoleSwitch />
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  );
}
