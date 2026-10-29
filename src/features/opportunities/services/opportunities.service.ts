/**
 * Opportunities API calls — the job feed in this app's Route Handlers
 * (MongoDB). Members only ever receive approved roles; contact details come
 * back only when the server allows it. Admin calls carry the preview role
 * while login isn't built (the server honours it on a dev machine only).
 */
import { APP_ENDPOINTS, toQueryString } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/http-error";
import { getAccessToken } from "@/lib/auth/token-store";
import { env } from "@/lib/config/env";
import { logAdminAction } from "@/lib/sample-data";
import type { ApiEnvelope, ApiErrorEnvelope, ResponseMeta } from "@/types/api";
import type { Role } from "@/types/enums";
import type { CollectorKind, IngestRun, IngestSource, RoleListing, RoleStatus } from "@/types/roles";

import type { IngestSourceInput, IngestUrlInput, RoleInput, RolePatch } from "../schemas";

/** Board filters, as the API takes them. */
export interface RoleFilters {
  family?: string;
  city?: string;
  remote?: string;
  type?: string;
  q?: string;
  sort?: string;
  page?: number;
}

async function call<T>(role: Role, path: string, init: RequestInit = {}): Promise<{ data: T; meta?: ResponseMeta }> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!env.NEXT_PUBLIC_AUTH_ENABLED) headers.set("x-preview-role", role);

  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  if (response.status === 204) return { data: undefined as T };
  const body = (await response.json().catch(() => null)) as (ApiEnvelope<T> & ApiErrorEnvelope) | null;
  if (!response.ok || !body || !("data" in body)) {
    throw new ApiError(response.status, body?.error?.code ?? "UNKNOWN", body?.error?.message ?? "Couldn't reach the job feed", body?.error?.details);
  }
  return { data: body.data, meta: body.meta };
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const label = (r: RoleListing) => `${r.title} · ${r.company.name}`;

export const opportunitiesService = {
  list: async (role: Role, filters: RoleFilters) => {
    const { data, meta } = await call<RoleListing[]>(role, `${APP_ENDPOINTS.roles.list}${toQueryString(filters)}`);
    return { roles: data, total: meta?.total ?? data.length, page: meta?.page ?? 1, pageSize: meta?.pageSize ?? data.length, cities: meta?.cities ?? [] };
  },

  detail: async (role: Role, id: string): Promise<RoleListing | null> => {
    try {
      return (await call<RoleListing>(role, APP_ENDPOINTS.roles.detail(id))).data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  // ── Admin ──
  adminList: async (status: RoleStatus, page: number) => {
    const { data, meta } = await call<RoleListing[]>("admin", `${APP_ENDPOINTS.adminRoles.list}${toQueryString({ status, page })}`);
    return {
      roles: data,
      total: meta?.total ?? data.length,
      page: meta?.page ?? page,
      pageSize: meta?.pageSize ?? 20,
      counts: (meta?.counts ?? {}) as Partial<Record<RoleStatus, number>>,
    };
  },

  create: async (input: RoleInput) => {
    const role = (await call<RoleListing>("admin", APP_ENDPOINTS.adminRoles.list, json("POST", input))).data;
    logAdminAction({ actor: "Admin", action: "Added a role", object: label(role) });
    return role;
  },

  update: async ({ id, patch }: { id: string; patch: RolePatch }) => {
    const role = (await call<RoleListing>("admin", APP_ENDPOINTS.adminRoles.detail(id), json("PATCH", patch))).data;
    const action = patch.status && Object.keys(patch).length === 1 ? `Marked a role ${patch.status}` : "Edited a role";
    logAdminAction({ actor: "Admin", action, object: label(role) });
    return role;
  },

  remove: async (role: RoleListing) => {
    await call<void>("admin", APP_ENDPOINTS.adminRoles.detail(role.id), { method: "DELETE" });
    logAdminAction({ actor: "Admin", action: "Deleted a role", object: label(role) });
  },

  fromUrl: async (input: IngestUrlInput) => {
    const role = (await call<RoleListing>("admin", APP_ENDPOINTS.adminRoles.fromUrl, json("POST", input))).data;
    logAdminAction({ actor: "Admin", action: "Added a role from a URL", object: label(role) });
    return role;
  },

  feed: async () => (await call<{ sources: IngestSource[]; runs: IngestRun[] }>("admin", APP_ENDPOINTS.ingest.sources)).data,

  addSource: async (input: IngestSourceInput) => (await call<IngestSource>("admin", APP_ENDPOINTS.ingest.sources, json("POST", input))).data,

  toggleSource: async ({ id, enabled }: { id: string; enabled: boolean }) =>
    (await call<IngestSource>("admin", APP_ENDPOINTS.ingest.source(id), json("PATCH", { enabled }))).data,

  runNow: async (target: { source: CollectorKind | "all"; id?: string }) => {
    const summaries = (await call<{ source: CollectorKind; inserted: number; updated: number; errors: string[] }[]>(
      "admin",
      `${APP_ENDPOINTS.ingest.run}${toQueryString(target)}`,
      { method: "POST" },
    )).data;
    logAdminAction({ actor: "Admin", action: "Ran the job feed", object: target.id ? "one board" : target.source });
    return summaries;
  },
};
