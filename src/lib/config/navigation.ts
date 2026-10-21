/**
 * The single navigation source of truth.
 *
 * The sidebar, the topbar breadcrumb, and (later) the command palette all render
 * from this array — add a nav item here, not in three components. `roles` filters
 * what a user sees; that is a UI convenience, not authorization (the API still
 * enforces access).
 *
 * Structure follows the PRD (§5): the same five community sections for
 * everyone, Health right after Events for admins, then the admin menu.
 */
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  DatabaseZap,
  HeartPulse,
  House,
  Inbox,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  BellRing,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";
import type { Role } from "@/types/enums";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Omit to show for every signed-in role. */
  roles?: readonly Role[];
  /** Match child routes too (`/people/123` keeps `/people` active). */
  matchNested?: boolean;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const ADMIN_ONLY: readonly Role[] = ["admin"];

export const navigation: NavSection[] = [
  {
    title: "Community",
    items: [
      { title: "Overview", href: ROUTES.overview, icon: House },
      { title: "People", href: ROUTES.people, icon: Users, matchNested: true },
      { title: "Library", href: ROUTES.library, icon: BookOpen, matchNested: true },
      {
        title: "Opportunities",
        href: ROUTES.opportunities,
        icon: Briefcase,
        matchNested: true,
      },
      { title: "Events", href: ROUTES.events, icon: CalendarDays, matchNested: true },
      {
        title: "Health",
        href: ROUTES.health,
        icon: HeartPulse,
        roles: ADMIN_ONLY,
        matchNested: true,
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        title: "Admin Overview",
        href: ROUTES.admin,
        icon: LayoutDashboard,
        roles: ADMIN_ONLY,
      },
      {
        title: "Member Management",
        href: ROUTES.adminMembers,
        icon: UsersRound,
        roles: ADMIN_ONLY,
        matchNested: true,
      },
      {
        title: "Submissions & Approvals",
        href: ROUTES.adminApprovals,
        icon: Inbox,
        roles: ADMIN_ONLY,
        matchNested: true,
      },
      {
        title: "Data & Integrations",
        href: ROUTES.adminData,
        icon: DatabaseZap,
        roles: ADMIN_ONLY,
        matchNested: true,
      },
      {
        title: "Automations",
        href: ROUTES.adminAutomations,
        icon: BellRing,
        roles: ADMIN_ONLY,
        matchNested: true,
      },
      {
        title: "User Access",
        href: ROUTES.adminAccess,
        icon: KeyRound,
        roles: ADMIN_ONLY,
        matchNested: true,
      },
      {
        title: "Activity Logs",
        href: ROUTES.adminLogs,
        icon: ScrollText,
        roles: ADMIN_ONLY,
        matchNested: true,
      },
    ],
  },
];

/** Flat list of every nav item — used for breadcrumbs and title lookup. */
export const allNavItems: NavItem[] = navigation.flatMap(
  (section) => section.items,
);

/** Sections a given role may see, with empty sections dropped. */
export function navigationForRole(role: Role | undefined): NavSection[] {
  if (!role) return [];
  return navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(role),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/** Whether a nav item should render as active for the current pathname. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  return item.matchNested
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
}

/**
 * The nav item matching the current pathname, for the topbar and breadcrumb.
 * Exact matches win, then the longest nested prefix — so `/admin/members`
 * resolves to Member Management, not Admin Overview.
 */
export function findNavItem(pathname: string): NavItem | undefined {
  return (
    allNavItems.find((item) => item.href === pathname) ??
    allNavItems
      .filter((item) => pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]
  );
}

/** The section a nav item belongs to — the middle crumb in the breadcrumb. */
export function findNavSection(pathname: string): NavSection | undefined {
  const item = findNavItem(pathname);
  return item
    ? navigation.find((section) => section.items.includes(item))
    : undefined;
}
