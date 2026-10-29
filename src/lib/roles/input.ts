/**
 * Admin form input → database fields. Every field is named explicitly — a
 * request body is never spread into an update.
 */
import "server-only";

import type { UpdateFilter } from "mongodb";

import type { RoleDoc } from "@/lib/db/mongodb/roles.repository";
import type { RoleInput, RolePatch } from "@/features/opportunities/schemas";
import type { RoleContact } from "@/types/roles";

import { compact, dedupeKey, toE164 } from "./text";

const phone = (v?: string) => (v ? (toE164(v) ?? v) : v);

const contactOf = (i: RolePatch): RoleContact =>
  compact({
    name: i.contactName,
    roleAtCompany: i.contactRole,
    email: i.contactEmail,
    whatsapp: phone(i.contactWhatsapp),
    phone: phone(i.contactPhone),
    linkedinUrl: i.contactLinkedin,
    other: i.contactOther,
  });

/** A new role the team typed in themselves. */
export function newManualRole(input: RoleInput, now: Date, by: string): Omit<RoleDoc, "_id"> {
  const location = compact({ city: input.city, country: input.country, remoteMode: input.remoteMode });
  return {
    dedupeKey: dedupeKey(input.company, input.title, input.city || input.remoteMode),
    status: input.status,
    title: input.title,
    roleFamily: input.roleFamily,
    seniority: input.seniority,
    employmentType: input.employmentType,
    company: compact({ name: input.company, url: input.companyUrl }),
    location,
    salary: compact({ text: input.salaryText }),
    description: input.description,
    howToApply: input.howToApply || undefined,
    contact: contactOf(input),
    sources: [{ source: "manual", url: input.applyUrl, postedAt: now, firstSeenAt: now, lastSeenAt: now }],
    extraction: {},
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 30 * 864e5),
    ...(input.status === "approved" ? { verifiedAt: now, verifiedBy: by } : {}),
  };
}

/** PATCH → `$set` / `$unset`. An empty string clears a field. */
export function patchUpdate(patch: RolePatch, existing: RoleDoc, now: Date, by: string): UpdateFilter<RoleDoc> {
  const $set: Record<string, unknown> = { updatedAt: now };
  const $unset: Record<string, ""> = {};
  const put = (path: string, value: string | undefined) => {
    if (value === undefined) return;
    if (value === "") $unset[path] = "";
    else $set[path] = value;
  };

  put("title", patch.title);
  put("company.name", patch.company);
  put("company.url", patch.companyUrl);
  if (patch.roleFamily) $set.roleFamily = patch.roleFamily;
  if (patch.seniority) $set.seniority = patch.seniority;
  if (patch.employmentType) $set.employmentType = patch.employmentType;
  put("location.city", patch.city);
  put("location.country", patch.country);
  if (patch.remoteMode) $set["location.remoteMode"] = patch.remoteMode;
  put("salary.text", patch.salaryText);
  if (patch.description !== undefined) $set.description = patch.description;
  put("howToApply", patch.howToApply);
  if (patch.applyUrl) $set["sources.0.url"] = patch.applyUrl;
  put("contact.name", patch.contactName);
  put("contact.roleAtCompany", patch.contactRole);
  put("contact.email", patch.contactEmail);
  put("contact.whatsapp", patch.contactWhatsapp === undefined ? undefined : (phone(patch.contactWhatsapp) ?? ""));
  put("contact.phone", patch.contactPhone === undefined ? undefined : (phone(patch.contactPhone) ?? ""));
  put("contact.linkedinUrl", patch.contactLinkedin);
  put("contact.other", patch.contactOther);

  if (patch.status) {
    $set.status = patch.status;
    if (patch.status === "approved" && existing.status !== "approved") {
      $set.verifiedAt = now;
      $set.verifiedBy = by;
    }
  }

  // Keep the dedupe key true to what the role now says.
  const title = patch.title ?? existing.title;
  const company = patch.company ?? existing.company.name;
  const city = patch.city !== undefined ? patch.city : existing.location.city;
  const mode = patch.remoteMode ?? existing.location.remoteMode;
  $set.dedupeKey = dedupeKey(company, title, city || mode);

  return Object.keys($unset).length ? { $set, $unset } : { $set };
}
