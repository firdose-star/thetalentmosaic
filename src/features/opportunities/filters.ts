/**
 * Job board filters (in the URL) → API params, and the small text helpers
 * cards and the detail page share.
 */
import { formatDistanceToNowStrict } from "date-fns";

import {
  EMPLOYMENT_TYPE_LABELS,
  REMOTE_MODE_LABELS,
  ROLE_SOURCE_LABELS,
  type RoleListing,
} from "@/types/roles";

import type { RoleFilters } from "./services/opportunities.service";

export const JOB_FILTER_KEYS = ["role", "location", "type", "sort", "q", "page"] as const;
export type JobFilterKey = (typeof JOB_FILTER_KEYS)[number];
export type JobFilters = Record<JobFilterKey, string>;

/** The Location filter's value for remote roles. */
export const REMOTE = "Remote";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "closing", label: "Closing soonest" },
];

export function toApiFilters(f: JobFilters): RoleFilters {
  return {
    family: f.role || undefined,
    city: f.location && f.location !== REMOTE ? f.location : undefined,
    remote: f.location === REMOTE ? "true" : undefined,
    type: f.type || undefined,
    q: f.q || undefined,
    sort: f.sort || undefined,
    page: Number(f.page) > 1 ? Number(f.page) : undefined,
  };
}

const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export function postedText(role: RoleListing) {
  const at = role.sources[0]?.postedAt;
  return at ? `Posted ${ago(at)}` : "Posting date not given";
}

export const sourceLabel = (role: RoleListing) => ROLE_SOURCE_LABELS[role.sources[0]?.source ?? "manual"];

export function locationText(role: RoleListing) {
  const place = [role.location.city, role.location.country].filter(Boolean).join(", ") || role.location.raw;
  const mode = role.location.remoteMode;
  if (!place) return mode === "unknown" ? "Location not stated" : REMOTE_MODE_LABELS[mode];
  return mode === "unknown" || mode === "onsite" ? place : `${place} · ${REMOTE_MODE_LABELS[mode]}`;
}

export const typeText = (role: RoleListing) => (role.employmentType === "unknown" ? null : EMPLOYMENT_TYPE_LABELS[role.employmentType]);

/** WhatsApp link for an E.164 number. */
export const whatsappUrl = (e164: string) => `https://wa.me/${e164.replace(/\D/g, "")}`;

export const checkedText = (role: RoleListing) =>
  role.verifiedAt
    ? `Checked by the team on ${new Date(role.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : null;
