/**
 * The job-feed pipeline (spec §4–§7): collect → keyword gate → extract →
 * upsert. Used by the cron route, the admin "Run now" button, and "Add from
 * URL".
 *
 * Postings already in the feed (same source URL) are only marked as seen
 * again — no model call — so a re-run is cheap. New postings are capped at
 * 60 per invocation to stay inside the function time limit; the rest wait for
 * the next run.
 */
import "server-only";

import { MongoServerError, type WithId } from "mongodb";

import {
  enabledSources,
  markSourceRun,
  rejectedUrls,
  rememberRejected,
  saveRun,
  type IngestRunDoc,
  type IngestSourceDoc,
} from "@/lib/db/mongodb/ingest.repository";
import {
  ensureRoleIndexes,
  findByDedupeKey,
  insertRole,
  knownSourceUrls,
  touchSources,
  updateRole,
  type RoleDoc,
  type RoleSourceDoc,
} from "@/lib/db/mongodb/roles.repository";
import type { CollectorKind } from "@/types/roles";

import { COLLECTORS, type RawRecord } from "./collectors";
import { extractRole, type ExtractedRole } from "./extract";
import { passesGate } from "./gate";
import { DESKTOP_UA, fetchWithRetry, mapLimit } from "./http";
import { compact, dedupeKey, fillEmpty, htmlToText } from "./text";

export const NEW_PER_RUN = 60;
const DAY = 864e5;

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

function sourceEntry(record: RawRecord, now: Date): RoleSourceDoc {
  return {
    source: record.source,
    url: record.url,
    ...(record.posterName ? { posterName: record.posterName } : {}),
    ...(record.posterUrl ? { posterUrl: record.posterUrl } : {}),
    ...(record.postedAt && !Number.isNaN(record.postedAt.getTime()) ? { postedAt: record.postedAt } : {}),
    firstSeenAt: now,
    lastSeenAt: now,
    rawText: record.rawText,
  };
}

/**
 * Insert a new role, or fold this sighting into the one it duplicates: the
 * source is added (or refreshed), empty fields are filled, status untouched.
 */
export async function upsertRole(record: RawRecord, role: ExtractedRole, now = new Date()): Promise<{ doc: WithId<RoleDoc>; outcome: "inserted" | "updated" }> {
  await ensureRoleIndexes();
  const key = dedupeKey(role.company.name, role.title, role.location.city || role.location.remoteMode);
  const source = sourceEntry(record, now);

  const existing = await findByDedupeKey(key);
  if (existing) {
    const known = existing.sources.some((s) => s.url === source.url);
    const sources = known
      ? existing.sources.map((s) => (s.url === source.url ? { ...s, lastSeenAt: now, rawText: source.rawText } : s))
      : [...existing.sources, source];
    const doc = await updateRole(existing._id, {
      $set: compact({
        sources,
        description: existing.description || role.description,
        howToApply: existing.howToApply || role.howToApply,
        contact: fillEmpty(existing.contact ?? {}, role.contact),
        salary: fillEmpty(existing.salary ?? {}, role.salary),
        updatedAt: now,
      }),
    });
    return { doc: doc ?? existing, outcome: "updated" };
  }

  const { isHrRole, ...fields } = role;
  void isHrRole;
  try {
    const doc = await insertRole({
      ...fields,
      dedupeKey: key,
      status: "unverified",
      sources: [source],
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 30 * DAY),
    });
    return { doc, outcome: "inserted" };
  } catch (error) {
    // Two sightings raced on the unique key — the other one won; merge into it.
    if (error instanceof MongoServerError && error.code === 11000) return upsertRole(record, role, now);
    throw error;
  }
}

/* ── Scheduled collection ─────────────────────────────────────────────────── */

export interface RunSummary {
  source: CollectorKind;
  fetched: number;
  matched: number;
  inserted: number;
  updated: number;
  deferred: number;
  errors: string[];
}

async function collectKind(kind: CollectorKind, targets: WithId<IngestSourceDoc>[], budget: { left: number }): Promise<RunSummary> {
  const startedAt = new Date();
  const run: Omit<IngestRunDoc, "_id"> = { source: kind, startedAt, fetched: 0, matched: 0, inserted: 0, updated: 0, deferred: 0, errors: [] };

  const batches = await mapLimit(targets, 4, async (target) => {
    try {
      const records = await COLLECTORS[kind](target);
      await markSourceRun(target._id, `ok · ${records.length} postings`, startedAt);
      return records;
    } catch (error) {
      const label = target.slug ?? kind;
      run.errors.push(`${label}: ${message(error)}`);
      await markSourceRun(target._id, `error · ${message(error)}`, startedAt).catch(() => {});
      return [];
    }
  });
  const records = [...new Map(batches.flatMap((b) => b ?? []).map((r) => [r.url, r])).values()];
  run.fetched = records.length;

  const matched = records.filter(passesGate);
  run.matched = matched.length;

  try {
    await ensureRoleIndexes();
    const known = await knownSourceUrls(matched.map((r) => r.url));
    if (known.size) {
      await touchSources([...known], new Date());
      run.updated += known.size;
    }

    const dropped = await rejectedUrls(matched.filter((r) => !known.has(r.url)).map((r) => r.url));
    const fresh = matched.filter((r) => !known.has(r.url) && !dropped.has(r.url));
    const batch = fresh.slice(0, Math.max(0, budget.left));
    budget.left -= batch.length;
    run.deferred = fresh.length - batch.length;

    await mapLimit(batch, 4, async (record) => {
      try {
        const role = await extractRole(record);
        // Collected postings that turn out not to be HR roles are dropped. Claude's
        // verdict is remembered so it isn't paid for again; the rules' isn't, so
        // Claude gets a look once ANTHROPIC_API_KEY is set.
        if (!role.isHrRole) return role.extraction.model ? rememberRejected(record.url, new Date()) : undefined;
        const { outcome } = await upsertRole(record, role);
        run[outcome]++;
      } catch (error) {
        run.errors.push(`${record.url}: ${message(error)}`);
      }
    });
  } catch (error) {
    run.errors.push(`database: ${message(error)}`);
  }

  run.finishedAt = new Date();
  await saveRun(run).catch((error) => run.errors.push(`couldn't save the run log: ${message(error)}`));
  // One line per run, in production too (the logger drops info there).
  console.info(
    `[ingest] source=${kind} fetched=${run.fetched} matched=${run.matched} inserted=${run.inserted} updated=${run.updated} errors=${run.errors.length}`,
  );
  return { source: kind, fetched: run.fetched, matched: run.matched, inserted: run.inserted, updated: run.updated, deferred: run.deferred ?? 0, errors: run.errors };
}

/** Run every enabled collector (or one kind, or one board). A failing source never stops the others. */
export async function runIngest(filter: { kind?: CollectorKind; id?: string } = {}): Promise<RunSummary[]> {
  const targets = await enabledSources(filter);
  const byKind = new Map<CollectorKind, WithId<IngestSourceDoc>[]>();
  for (const t of targets) byKind.set(t.kind, [...(byKind.get(t.kind) ?? []), t]);
  const budget = { left: NEW_PER_RUN };
  const summaries: RunSummary[] = [];
  for (const [kind, list] of byKind) summaries.push(await collectKind(kind, list, budget));
  return summaries;
}

/* ── Add from URL ─────────────────────────────────────────────────────────── */

const LOGIN_WALL = /authwall|\/login|\/signin|\/uas\/|checkpoint\/|accounts\.google/i;

/** A page's readable text, or null when it can't be read (login wall, error, empty). */
export async function readPage(url: string): Promise<string | null> {
  try {
    const response = await fetchWithRetry(url, { headers: { "User-Agent": DESKTOP_UA, Accept: "text/html" }, redirect: "follow" }, { retries: 1 });
    if (!response.ok || LOGIN_WALL.test(response.url)) return null;
    const html = await response.text();
    const meta = (name: string) =>
      html.match(new RegExp(`<meta[^>]+(?:property|name)="${name}"[^>]+content="([^"]*)"`, "i"))?.[1] ??
      html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${name}"`, "i"))?.[1];
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "";
    const body = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
    const text = [htmlToText(title), htmlToText(meta("og:description") ?? ""), htmlToText(body)].filter(Boolean).join("\n\n").slice(0, 20_000);
    if (text.length < 200 || /sign in to (view|see)|join linkedin|log in to continue/i.test(text.slice(0, 1500))) return null;
    return text;
  } catch {
    return null;
  }
}

/** "Add from URL": read the page (or the pasted text), extract, upsert as `manual_url`. */
export async function ingestUrl(url: string, pastedText?: string) {
  const text = pastedText?.trim() || (await readPage(url));
  if (!text) return null;
  const record: RawRecord = { source: "manual_url", url, rawText: text, postedAt: new Date() };
  const role = await extractRole(record);
  if (!role.isHrRole) {
    // The team asked for this one, so keep it — but say so.
    role.extraction.warnings = [...role.extraction.warnings, "This doesn't read like an HR / People / Talent role — check before approving."];
  }
  return upsertRole(record, role);
}
