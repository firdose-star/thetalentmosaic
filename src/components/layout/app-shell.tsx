"use client";

/**
 * The pinned app shell: sidebar + topbar fixed to the viewport, content
 * scrolling ONLY inside the ScrollArea.
 *
 * Two details do all the work, and both are easy to lose in a refactor:
 *
 *  1. `h-svh overflow-hidden` on the provider pins the chrome to the viewport.
 *  2. `min-h-0` on every scrolling flex child. Without it a flex child grows to
 *     its content height, the page scrolls as a whole, and the sidebar and
 *     topbar scroll away with it. This is *the* classic app-shell bug.
 *
 * Members and admins share this one shell (PRD §5: navigation is identical
 * across sections); the sidebar filters admin items by role.
 */
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { BuiltByMesa } from "@/components/layout/brand";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <AppTopbar />
        <ScrollArea className="min-h-0 flex-1">
          {/* @container/main: page grids use @xl/main: and @4xl/main: so they
              reflow when the SIDEBAR collapses, not just when the viewport
              resizes. Viewport breakpoints are wrong inside a shell. */}
          <main className="@container/main mx-auto flex w-full max-w-[110rem] flex-col gap-5 p-4 md:p-6">
            {children}
          </main>
          <footer className="border-t px-4 py-5">
            <BuiltByMesa />
          </footer>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
