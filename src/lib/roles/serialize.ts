/**
 * Database documents → API shapes. The visibility rules live here, in one
 * place: `rawText` never leaves the server, `contact` only when allowed, and
 * extraction details only for admins.
 */
import "server-only";

import type { WithId } from "mongodb";

import type { IngestRunDoc, IngestSourceDoc } from "@/lib/db/mongodb/ingest.repository";
import type { RoleDoc } from "@/lib/db/mongodb/roles.repository";
import type { IngestRun, IngestSource, RoleListing } from "@/types/roles";

const iso = (d?: Date) => (d ? new Date(d).toISOString() : undefined);

export function toListing(doc: WithId<RoleDoc>, { contact, admin }: { contact: boolean; admin: boolean }): RoleListing {
  const hasContact = Object.values(doc.contact ?? {}).some(Boolean);
  return {
    id: doc._id.toHexString(),
    status: doc.status,
    title: doc.title,
    roleFamily: doc.roleFamily,
    seniority: doc.seniority,
    employmentType: doc.employmentType,
    industry: doc.industry ?? "other",
    experience: doc.experience ?? {},
    experienceBand: doc.experienceBand ?? "other",
    company: doc.company,
    location: doc.location,
    salary: doc.salary ?? {},
    description: doc.description,
    howToApply: doc.howToApply,
    ...(contact && hasContact ? { contact: doc.contact } : {}),
    sources: doc.sources.map((s) => ({
      source: s.source,
      url: s.url,
      posterName: s.posterName,
      posterUrl: s.posterUrl,
      postedAt: iso(s.postedAt),
      firstSeenAt: iso(s.firstSeenAt)!,
      lastSeenAt: iso(s.lastSeenAt)!,
    })),
    ...(admin
      ? { extraction: { ...doc.extraction, extractedAt: iso(doc.extraction?.extractedAt) } }
      : {}),
    createdAt: iso(doc.createdAt)!,
    updatedAt: iso(doc.updatedAt)!,
    verifiedAt: iso(doc.verifiedAt),
    verifiedBy: admin ? doc.verifiedBy : undefined,
    expiresAt: iso(doc.expiresAt),
  };
}

export const toIngestSource = (d: IngestSourceDoc): IngestSource => ({
  id: d._id.toHexString(),
  kind: d.kind,
  slug: d.slug,
  companyName: d.companyName,
  enabled: d.enabled,
  lastRunAt: iso(d.lastRunAt),
  lastStatus: d.lastStatus,
});

export const toIngestRun = (d: IngestRunDoc): IngestRun => ({
  id: d._id.toHexString(),
  source: d.source,
  startedAt: iso(d.startedAt)!,
  finishedAt: iso(d.finishedAt),
  fetched: d.fetched,
  matched: d.matched,
  inserted: d.inserted,
  updated: d.updated,
  errors: d.deferred ? [...d.errors, `${d.deferred} new postings left for the next run`] : d.errors,
});
