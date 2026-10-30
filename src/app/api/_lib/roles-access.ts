/**
 * Shared rules for the job-feed Route Handlers: who may list roles, who sees
 * contact details, and query-string parsing. SERVER ONLY.
 */
import "server-only";

import { z } from "zod";

import { getServerEnv } from "@/lib/config/env";
import { logger } from "@/lib/logger";
import { API_ERROR_CODES } from "@/types/api";
import { EMPLOYMENT_TYPES, EXPERIENCE_BANDS, INDUSTRIES, ROLE_FAMILIES, ROLE_STATUSES } from "@/types/roles";

import { fail } from "./api-response";
import { isMember, type Caller } from "./session";

/** Members, or anyone when ROLES_PUBLIC_LIST is on. */
export const mayListRoles = (caller: Caller | null) => isMember(caller) || getServerEnv().ROLES_PUBLIC_LIST;

/** Contact details: signed-in members and admins, or everyone if the gate is switched off. */
export const maySeeContacts = (caller: Caller | null) =>
  !getServerEnv().ROLES_CONTACTS_REQUIRE_AUTH || (caller?.authenticated ?? false);

const blankToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const rolesQuerySchema = z.object({
  family: z.preprocess(blankToUndefined, z.enum(ROLE_FAMILIES).optional()),
  city: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  remote: z.preprocess(blankToUndefined, z.enum(["true", "false"]).optional()),
  type: z.preprocess(blankToUndefined, z.enum(EMPLOYMENT_TYPES).optional()),
  industry: z.preprocess(blankToUndefined, z.enum(INDUSTRIES).optional()),
  exp: z.preprocess(blankToUndefined, z.enum(EXPERIENCE_BANDS).optional()),
  q: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  sort: z.preprocess(blankToUndefined, z.enum(["newest", "closing"]).default("newest")),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).default(1)),
  pageSize: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(50).default(20)),
});

export const adminRolesQuerySchema = z.object({
  status: z.preprocess(blankToUndefined, z.enum(ROLE_STATUSES).default("unverified")),
  q: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).default(1)),
  pageSize: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(50).default(20)),
});

export const searchParamsOf = (request: Request) => Object.fromEntries(new URL(request.url).searchParams);

/** The database is down or not configured — a stable message, the detail in the log. */
export function feedUnavailable(error: unknown) {
  logger.error("[roles] database error", error);
  return fail(503, API_ERROR_CODES.unknown, "The job feed isn't reachable right now. Try again in a minute.");
}
