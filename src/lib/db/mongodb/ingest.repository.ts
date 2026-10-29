/**
 * `ingest_sources` — the boards the job feed polls — and `ingest_runs`, one
 * document per collector run for Admin → Data & Integrations. Admin and cron
 * only; no member route reads these.
 */
import "server-only";

import type { ObjectId } from "mongodb";

import type { CollectorKind } from "@/types/roles";

import seed from "@config/ingest-sources.json";
import { getDb } from "./connect";
import { isValidObjectId, toObjectId } from "./ids";

export interface IngestSourceDoc {
  _id: ObjectId;
  kind: CollectorKind;
  slug?: string;
  companyName?: string;
  enabled: boolean;
  lastRunAt?: Date;
  lastStatus?: string;
}

export interface IngestRunDoc {
  _id: ObjectId;
  source: CollectorKind;
  startedAt: Date;
  finishedAt?: Date;
  fetched: number;
  matched: number;
  inserted: number;
  updated: number;
  /** New postings left for the next run (each run reads at most 60). */
  deferred?: number;
  errors: string[];
}

async function sources() {
  return (await getDb()).collection<IngestSourceDoc>("ingest_sources");
}
async function runs() {
  return (await getDb()).collection<IngestRunDoc>("ingest_runs");
}

let seeded: Promise<unknown> | null = null;
/** Bring ingest_sources up to date with config/ingest-sources.json, once per server process. */
function ensureSeeded() {
  seeded ??= (async () => {
    const c = await sources();
    await c.createIndex({ kind: 1, slug: 1 }, { unique: true, name: "kind_slug" });
    // Add what the config has and the collection doesn't; never touch the admin's on/off choice.
    await c.bulkWrite(
      seed.sources.map((s) => ({
        updateOne: {
          filter: { kind: s.kind as CollectorKind, slug: "slug" in s ? s.slug : undefined },
          update: { $setOnInsert: { ...s, kind: s.kind as CollectorKind } },
          upsert: true,
        },
      })),
    );
  })().catch((error) => {
    seeded = null;
    throw error;
  });
  return seeded;
}

export async function listSources() {
  await ensureSeeded();
  return (await sources()).find().sort({ kind: 1, companyName: 1 }).toArray();
}

export async function enabledSources(filter: { kind?: CollectorKind; id?: string }) {
  await ensureSeeded();
  const query: Record<string, unknown> = { enabled: true };
  if (filter.kind) query.kind = filter.kind;
  if (filter.id && isValidObjectId(filter.id)) query._id = toObjectId(filter.id);
  return (await sources()).find(query).toArray();
}

export async function addSource(input: { kind: CollectorKind; slug: string; companyName?: string }) {
  await ensureSeeded();
  const doc = { kind: input.kind, slug: input.slug, companyName: input.companyName ?? input.slug, enabled: true };
  const result = await (await sources()).insertOne(doc as IngestSourceDoc);
  return { ...doc, _id: result.insertedId } as IngestSourceDoc;
}

export async function setSourceEnabled(id: string, enabled: boolean) {
  if (!isValidObjectId(id)) return null;
  return (await sources()).findOneAndUpdate({ _id: toObjectId(id) }, { $set: { enabled } }, { returnDocument: "after" });
}

export async function markSourceRun(id: ObjectId, lastStatus: string, at: Date) {
  await (await sources()).updateOne({ _id: id }, { $set: { lastRunAt: at, lastStatus } });
}

export async function saveRun(run: Omit<IngestRunDoc, "_id">) {
  const c = await runs();
  const result = await c.insertOne(run as IngestRunDoc);
  return { ...run, _id: result.insertedId } as IngestRunDoc;
}

export async function recentRuns(limit = 20) {
  return (await runs()).find().sort({ startedAt: -1 }).limit(limit).toArray();
}

/* ── Postings read and dropped as not-HR ─────────────────────────────────── */

interface RejectDoc {
  _id: string;
  at: Date;
}

async function rejects() {
  const c = (await getDb()).collection<RejectDoc>("ingest_rejects");
  // Forgotten after 30 days, so a reworded posting gets another look.
  await c.createIndex({ at: 1 }, { expireAfterSeconds: 30 * 86_400, name: "forget_after_30d" });
  return c;
}

/** Of these URLs, the ones already read and dropped — skipped without another model call. */
export async function rejectedUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const docs = await (await rejects()).find({ _id: { $in: urls } }, { projection: { _id: 1 } }).toArray();
  return new Set(docs.map((d) => d._id));
}

export async function rememberRejected(url: string, at: Date) {
  await (await rejects()).updateOne({ _id: url }, { $set: { at } }, { upsert: true });
}
