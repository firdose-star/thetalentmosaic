/**
 * The `roles` collection — the Opportunities job feed.
 *
 * Unlike the per-user example repository, roles have no owner: they belong to
 * the community and admins curate them. Authorization therefore lives in the
 * Route Handlers (admin check before any write, `status: "approved"` forced on
 * every member read). Members reach this file only through `listApproved` and
 * `getApproved`, which put the status IN the filter.
 */
import "server-only";

import type { Filter, ObjectId, Sort, UpdateFilter, WithId } from "mongodb";

import type { ExtractedRole } from "@/lib/roles/extract";
import type { EmploymentType, RoleFamily, RoleSourceKind, RoleStatus } from "@/types/roles";

import { getDb } from "./connect";
import { isValidObjectId, toObjectId } from "./ids";

const COLLECTION = "roles";

export const MANUAL_SOURCES: RoleSourceKind[] = ["manual", "manual_url"];

export interface RoleSourceDoc {
  source: RoleSourceKind;
  url: string;
  posterName?: string;
  posterUrl?: string;
  postedAt?: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  /** What we extracted from — for audit and re-extraction. Never sent to members. */
  rawText?: string;
}

export type RoleDoc = Omit<ExtractedRole, "isHrRole" | "extraction"> & {
  _id: ObjectId;
  dedupeKey: string;
  status: RoleStatus;
  sources: RoleSourceDoc[];
  extraction: { model?: string; confidence?: number; warnings?: string[]; extractedAt?: Date };
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  expiresAt?: Date;
};

async function roles() {
  const db = await getDb();
  return db.collection<RoleDoc>(COLLECTION);
}

let indexes: Promise<unknown> | null = null;
/** Created once per server process; cheap no-ops after the first time. */
export function ensureRoleIndexes() {
  indexes ??= roles()
    .then((c) =>
      c.createIndexes([
        { key: { dedupeKey: 1 }, name: "dedupe_key", unique: true },
        { key: { status: 1, updatedAt: -1 }, name: "status_updated" },
        { key: { roleFamily: 1 }, name: "role_family" },
        { key: { "location.city": 1 }, name: "location_city" },
        { key: { expiresAt: 1 }, name: "expires_at" },
        { key: { "sources.url": 1 }, name: "source_url" },
      ]),
    )
    .catch((error) => {
      indexes = null;
      throw error;
    });
  return indexes;
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

export interface RoleQuery {
  family?: RoleFamily;
  city?: string;
  remote?: boolean;
  type?: EmploymentType;
  q?: string;
  sort?: "newest" | "closing";
  page: number;
  pageSize: number;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function filterFor(status: RoleStatus | RoleStatus[], q: Omit<RoleQuery, "page" | "pageSize" | "sort">): Filter<RoleDoc> {
  const filter: Filter<RoleDoc> = { status: Array.isArray(status) ? { $in: status } : status };
  if (q.family) filter.roleFamily = q.family;
  if (q.type) filter.employmentType = q.type;
  if (q.remote) filter["location.remoteMode"] = "remote";
  if (q.city) filter["location.city"] = { $regex: `^${escapeRegex(q.city)}$`, $options: "i" };
  if (q.q) {
    const re = { $regex: escapeRegex(q.q), $options: "i" };
    filter.$or = [{ title: re }, { "company.name": re }];
  }
  return filter;
}

async function page(filter: Filter<RoleDoc>, { sort = "newest", page, pageSize }: Pick<RoleQuery, "sort" | "page" | "pageSize">) {
  const c = await roles();
  const order: Sort = sort === "closing" ? { expiresAt: 1, _id: 1 } : { "sources.0.postedAt": -1, createdAt: -1 };
  const [docs, total] = await Promise.all([
    c.find(filter).sort(order).skip((page - 1) * pageSize).limit(Math.min(pageSize, 50)).toArray(),
    c.countDocuments(filter),
  ]);
  return { docs, total };
}

/** Members: approved roles only — the status is in the filter, never checked afterwards. */
/** Members see roles posted in the last 60 days only — older ones vanish the day they turn 60. */
const MAX_AGE_DAYS = 60;
const recent = (): Filter<RoleDoc> => ({ "sources.0.postedAt": { $gte: new Date(Date.now() - MAX_AGE_DAYS * 864e5) } });

export const listApproved = (q: RoleQuery) => page({ ...filterFor("approved", q), ...recent() }, q);

export async function getApproved(id: string) {
  if (!isValidObjectId(id)) return null;
  return (await roles()).findOne({ _id: toObjectId(id), status: "approved", ...recent() });
}

/** Cities that approved roles are in, for the Location filter. */
export async function approvedCities(): Promise<string[]> {
  const cities = (await (await roles()).distinct("location.city", { status: "approved", ...recent() })) as unknown[];
  return cities.filter((c): c is string => typeof c === "string" && c.length > 0).sort((a, b) => a.localeCompare(b));
}

/** Admin: any status. */
export const listForAdmin = (status: RoleStatus, q: Omit<RoleQuery, "family" | "city" | "remote" | "type">) =>
  page(filterFor(status, { q: q.q }), { ...q, sort: "newest" });

export async function getAny(id: string) {
  if (!isValidObjectId(id)) return null;
  return (await roles()).findOne({ _id: toObjectId(id) });
}

export async function countByStatus(): Promise<Record<RoleStatus, number>> {
  const rows = await (await roles()).aggregate<{ _id: RoleStatus; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray();
  const counts = { unverified: 0, approved: 0, hidden: 0, expired: 0 };
  for (const row of rows) counts[row._id] = row.n;
  return counts;
}

export async function findByDedupeKey(dedupeKey: string) {
  return (await roles()).findOne({ dedupeKey });
}

export async function findBySourceUrl(url: string) {
  return (await roles()).findOne({ "sources.url": url });
}

/** Which of these source URLs the feed already holds. */
export async function knownSourceUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const docs = await (await roles()).find({ "sources.url": { $in: urls } }, { projection: { "sources.url": 1 } }).toArray();
  const wanted = new Set(urls);
  return new Set(docs.flatMap((d) => d.sources.map((s) => s.url)).filter((u) => wanted.has(u)));
}

/* ── Writes ───────────────────────────────────────────────────────────────── */

export async function insertRole(doc: Omit<RoleDoc, "_id">): Promise<WithId<RoleDoc>> {
  const result = await (await roles()).insertOne(doc as RoleDoc);
  return { ...doc, _id: result.insertedId } as WithId<RoleDoc>;
}

export async function updateRole(id: ObjectId | string, update: UpdateFilter<RoleDoc>) {
  if (typeof id === "string" && !isValidObjectId(id)) return null;
  return (await roles()).findOneAndUpdate({ _id: toObjectId(id) }, update, { returnDocument: "after" });
}

/** Seen again at the source: refresh `lastSeenAt` on every matching source entry. */
export async function touchSources(urls: string[], now: Date) {
  if (urls.length === 0) return 0;
  const result = await (await roles()).updateMany(
    { "sources.url": { $in: urls } },
    { $set: { "sources.$[s].lastSeenAt": now, updatedAt: now } },
    { arrayFilters: [{ "s.url": { $in: urls } }] },
  );
  return result.modifiedCount;
}

export async function deleteRole(id: string) {
  if (!isValidObjectId(id)) return false;
  return (await (await roles()).deleteOne({ _id: toObjectId(id) })).deletedCount === 1;
}

/* ── Expiry ───────────────────────────────────────────────────────────────── */

const LIVE: RoleStatus[] = ["approved", "unverified"];

/** Collector roles no source has listed since `cutoff`. */
export async function expireUnseen(cutoff: Date, now: Date) {
  const result = await (await roles()).updateMany(
    { status: { $in: LIVE }, sources: { $not: { $elemMatch: { $or: [{ source: { $in: MANUAL_SOURCES } }, { lastSeenAt: { $gte: cutoff } }] } } } },
    { $set: { status: "expired", updatedAt: now } },
  );
  return result.modifiedCount;
}

/** Roles the team added whose `expiresAt` has passed. */
export async function expireManualPastDate(now: Date) {
  const result = await (await roles()).updateMany(
    { status: { $in: LIVE }, "sources.source": { $in: MANUAL_SOURCES }, expiresAt: { $lt: now } },
    { $set: { status: "expired", updatedAt: now } },
  );
  return result.modifiedCount;
}

/** Live roles whose primary link is worth re-checking, least recently updated first. */
export async function liveForLinkCheck(limit: number) {
  return (await roles()).find({ status: { $in: LIVE } }, { projection: { "sources.url": 1 } }).sort({ updatedAt: 1 }).limit(limit).toArray();
}

/** Live roles first posted more than 60 days ago. */
export async function expireOldPostings(now: Date) {
  const result = await (await roles()).updateMany(
    { status: { $in: LIVE }, "sources.0.postedAt": { $lt: new Date(now.getTime() - MAX_AGE_DAYS * 864e5) } },
    { $set: { status: "expired", updatedAt: now } },
  );
  return result.modifiedCount;
}

export async function markExpired(ids: ObjectId[], now: Date) {
  if (ids.length === 0) return 0;
  return (await (await roles()).updateMany({ _id: { $in: ids } }, { $set: { status: "expired", updatedAt: now } })).modifiedCount;
}
