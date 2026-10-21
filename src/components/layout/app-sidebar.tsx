"use client";

/**
 * The workspace sidebar. Every tab renders from `lib/config/navigation.ts` —
 * to add a link you edit that config, never this component.
 *
 * The active item gets green text (`--sidebar-primary`) over a highlight that
 * slides between tabs on navigation (Framer Motion `layoutId`).
 */
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand, BrandMark } from "@/components/layout/brand";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { isNavItemActive, navigationForRole } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { state } = useSidebar();
  const sections = navigationForRole(user?.role);
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-3">
        {/* Wordmark when expanded, mark alone when collapsed to the icon rail. */}
        {isCollapsed ? (
          <Link href="/" className="flex justify-center">
            <BrandMark />
          </Link>
        ) : (
          <Brand />
        )}
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  return (
                    <SidebarMenuItem key={item.href}>
                      {/* One shared layoutId: Framer slides the highlight
                          from the old tab to the new one on navigation. */}
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          aria-hidden
                          className="absolute inset-0 rounded-md bg-sidebar-accent"
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      )}
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "relative",
                          active &&
                            "font-medium text-sidebar-primary data-active:bg-transparent hover:text-sidebar-primary",
                        )}
                        render={
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
