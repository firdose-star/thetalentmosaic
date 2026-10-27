/**
 * Global search (spec §5, PRD §6.6): name, startup, designation, location, HR
 * function, hobby, vendor, job title or event — grouped by
 * category and filtered by what the viewer may see.
 *
 * Computed from the community store (the Mastersheet) for now. Swap the body of `search` for
 *   api.get<SearchGroup[]>(`${ENDPOINTS.search}?q=...`)
 * once the API exists; the server must apply the same permission rules.
 */
import { ROUTES } from "@/lib/constants";
import {
  communityStore,
  currentMembers,
} from "@/lib/sample-data";
import { shortDate } from "@/lib/community";
import type { Role } from "@/types/enums";

import type { SearchGroup } from "../types";

const PER_GROUP = 5;

export const searchService = {
  search: async (query: string, role: Role): Promise<SearchGroup[]> => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const isAdmin = role === "admin";
    const has = (...fields: (string | null | undefined)[]) =>
      fields.join(" ").toLowerCase().includes(q);

    const groups: SearchGroup[] = [
      {
        category: "People",
        results: currentMembers().filter((m) => (isAdmin || m.directoryConsent !== false) &&
          has(
            m.name,
            m.startup,
            m.designation,
            m.city,
            m.hrFunction,
            m.seniority,
            ...m.hobbies,
            // Contact details are admin only (spec §6.3).
            isAdmin ? m.email : undefined,
          ),
        ).map((m) => ({
          id: m.id,
          title: m.name,
          subtitle: `${m.designation} at ${m.startup} · ${m.city}`,
          href: `${ROUTES.people}/${m.id}`,
        })),
      },
      {
        category: "Vendors",
        results: communityStore.library.vendors.filter((v) => has(v.name, v.category, v.description, v.city, v.area)).map(
          (v) => ({
            id: v.id,
            title: v.name,
            subtitle: `${v.category} · ${v.city}`,
            href: `${ROUTES.library}/vendors?q=${encodeURIComponent(v.name)}`,
          }),
        ),
      },
      {
        category: "Resources",
        results: communityStore.library.resources.filter(
          (r) => (isAdmin || r.access !== "Admins") && has(r.title, r.category, r.description),
        ).map((r) => ({
          id: r.id,
          title: r.title,
          subtitle: `${r.category} · ${r.source}`,
          href: `${ROUTES.library}/resources?q=${encodeURIComponent(r.title)}`,
        })),
      },
      {
        category: "Roles",
        results: communityStore.jobs.filter(
          (j) => j.status === "active" && has(j.title, j.company, j.location, j.hrFunction),
        ).map((j) => ({
          id: j.id,
          title: j.title,
          subtitle: `${j.company} · ${j.location}`,
          href: `${ROUTES.opportunities}/${j.id}`,
        })),
      },
      {
        category: "Events",
        results: communityStore.events
          .filter((e) => has(e.title, e.city, e.category))
          .map((e) => ({
            id: e.id,
            title: e.title,
            subtitle: `${shortDate(e.date, true)} · ${e.city}`,
            href: `${ROUTES.events}/${e.id}`,
          })),
      },
    ];

    return groups
      .map((group) => ({
        ...group,
        total: group.results.length,
        results: group.results.slice(0, PER_GROUP),
      }))
      .filter((group) => group.total > 0);
  },
};
