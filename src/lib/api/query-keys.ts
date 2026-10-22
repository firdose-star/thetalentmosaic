/**
 * The single query-key factory. Hooks import keys from here — NEVER inline a
 * string key like `useQuery({ queryKey: ['users'] })`.
 *
 * Why: invalidation is only precise if every producer and every invalidator agree
 * on the exact key shape. One factory makes `qc.invalidateQueries({ queryKey:
 * queryKeys.users.all })` provably match every users query.
 *
 * Convention per feature:
 *   all      → the root key; invalidate this to refresh everything in the feature
 *   lists    → the list namespace; invalidate to refresh every list variant
 *   list(p)  → one parameterised list
 *   details  → the detail namespace
 *   detail(id)
 *
 * When you add a feature, add a block here in step 4 of the recipe (see README).
 */
import type { ListParams } from "@/types/api";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  health: {
    all: ["health"] as const,
    backend: () => [...queryKeys.health.all, "backend"] as const,
    /** Community Health (PRD §8) — distinct from the backend liveness check. */
    community: () => [...queryKeys.health.all, "community"] as const,
    engagement: () => [...queryKeys.health.community(), "engagement"] as const,
    activity: () => [...queryKeys.health.community(), "activity"] as const,
    tags: () => [...queryKeys.health.community(), "tags"] as const,
  },

  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: ListParams) => [...queryKeys.users.lists(), params ?? {}] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  overview: {
    all: ["overview"] as const,
    summary: () => [...queryKeys.overview.all, "summary"] as const,
    birthdayMessages: () => [...queryKeys.overview.all, "birthday-messages"] as const,
  },

  search: {
    all: ["search"] as const,
    query: (q: string, role: string) => [...queryKeys.search.all, role, q] as const,
  },

  people: {
    all: ["people"] as const,
    lists: () => [...queryKeys.people.all, "list"] as const,
    list: (filters: object) => [...queryKeys.people.lists(), filters] as const,
    detail: (id: string, role: string) => [...queryKeys.people.all, "detail", id, role] as const,
    options: () => [...queryKeys.people.all, "options"] as const,
  },

  library: {
    all: ["library"] as const,
    vendors: () => [...queryKeys.library.all, "vendors"] as const,
    resources: (role: string) => [...queryKeys.library.all, "resources", role] as const,
    recommendations: () => [...queryKeys.library.all, "recommendations"] as const,
  },

  opportunities: {
    all: ["opportunities"] as const,
    list: (role: string) => [...queryKeys.opportunities.all, "list", role] as const,
    detail: (id: string) => [...queryKeys.opportunities.all, "detail", id] as const,
    scraper: () => [...queryKeys.opportunities.all, "scraper"] as const,
  },

  events: {
    all: ["events"] as const,
    list: () => [...queryKeys.events.all, "list"] as const,
    detail: (id: string) => [...queryKeys.events.all, "detail", id] as const,
  },

  admin: {
    all: ["admin"] as const,
  },

  // ── Add one block per feature. Mirror the API resources. ──
} as const;

export type QueryKeys = typeof queryKeys;
