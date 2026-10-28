/**
 * An event's photo album, built from its two Drive links:
 *
 *  - hero        — the Moments picture (the first one, if Moments is a folder);
 *  - best        — the photos members see: hand-picked by admins, up to 30 —
 *                  not repeated, sharp, two or three clear faces, easy to read;
 *  - candidates  — the whole Photos [All] folder for admins to pick from,
 *                  best-scored first with burst shots left out (see score.ts).
 *
 * Nothing from the folder is shown until an admin picks it: the automatic
 * score catches dark and blurry shots, but can't judge faces or whether a
 * photo is easy to understand. Scoring runs in the background, once.
 * Admins can also upload photos (see uploads.ts) and remove any photo,
 * including the Moments picture. Picks, removals, uploads and scores live in
 * git-ignored data/ — they are private photos.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { driveImage, listFolderImages, parseDriveUrl, type DriveImage } from "./index";
import { hashDistance, photoHash, scorePhoto } from "./score";

/** At most this many photos are shown per event. */
export const BEST_MAX = 30;

export interface EventAlbum {
  hero: string | null;
  best: string[];
  /** Admin picking only. */
  candidates: string[];
  /** Removed by an admin; kept so they can be restored. */
  hidden: string[];
  /** curated: picks saved · unpicked: ready to pick · scoring: still ranking the folder. */
  ranking: "curated" | "unpicked" | "scoring";
  /** Where the picks are saved: the Photos [All] folder, else the Moments link. */
  albumKey: string | null;
}

const DATA = path.join(process.cwd(), "data");
const PICKS_FILE = path.join(DATA, "event-highlights.json");
const HIDDEN_FILE = path.join(DATA, "event-hidden.json");
const SCORES_FILE = path.join(DATA, ".drive-cache", "photo-scores.json");

/** A photo's quality score (0–1) and visual fingerprint. */
interface Scored {
  s: number;
  h: string;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}

/** Admin-picked photos (the ones members see), keyed by album (see buildAlbum). */
export const readPicks = () => readJson<Record<string, string[]>>(PICKS_FILE, {});

/** Photos an admin removed that would otherwise show (e.g. the Moments picture), keyed by album. */
export const readHidden = () => readJson<Record<string, string[]>>(HIDDEN_FILE, {});

export async function saveHidden(albumKey: string, ids: string[]) {
  const hidden = await readHidden();
  if (ids.length) hidden[albumKey] = ids;
  else delete hidden[albumKey];
  await writeJson(HIDDEN_FILE, hidden);
}

export async function savePicks(albumKey: string, ids: string[]) {
  const picks = await readPicks();
  if (ids.length) picks[albumKey] = ids;
  else delete picks[albumKey];
  await writeJson(PICKS_FILE, picks);
}

let scores: Record<string, Scored> | null = null;
const scoring = new Map<string, Promise<void>>();

async function loadScores() {
  scores ??= await readJson<Record<string, Scored>>(SCORES_FILE, {});
  return scores;
}

/** Score every photo in a folder once, a few at a time. Single-flight per folder. */
export function scoreFolder(folderId: string, images: DriveImage[]) {
  const running = scoring.get(folderId);
  if (running) return running;
  const job = (async () => {
    const known = await loadScores();
    const todo = images.filter((i) => known[i.id] === undefined);
    for (let i = 0; i < todo.length; i += 6) {
      await Promise.all(
        todo.slice(i, i + 6).map(async (img) => {
          const bytes = await driveImage(img.id, "thumb").catch(() => null);
          // Unreadable files sink to the bottom rather than being retried forever.
          known[img.id] = bytes
            ? { s: (await scorePhoto(bytes).catch(() => ({ score: 0 }))).score, h: await photoHash(bytes).catch(() => "0".repeat(16)) }
            : { s: 0, h: "0".repeat(16) };
        }),
      );
      await writeJson(SCORES_FILE, known);
    }
  })().finally(() => scoring.delete(folderId));
  scoring.set(folderId, job);
  return job;
}

/** Same shot uploaded twice (e.g. an edited copy) → keep the first. */
const dedupe = (images: DriveImage[]) => {
  const seen = new Set<string>();
  return images.filter((i) => !seen.has(i.name) && seen.add(i.name));
};


/**
 * Every photo best-first, with near-duplicates (burst shots) left out — the
 * order admins pick from. Unscored photos go last, in camera order.
 */
function bestFirst(ids: string[], known: Record<string, Scored>) {
  const scored = ids.filter((id) => known[id]).sort((a, b) => known[b].s - known[a].s);
  const kept: string[] = [];
  for (const id of scored) {
    if (!kept.some((k) => hashDistance(known[k].h, known[id].h) < 12)) kept.push(id);
  }
  return [...kept, ...ids.filter((id) => !known[id])];
}

export async function buildAlbum(links: { moments?: string | null; photos?: string | null }): Promise<EventAlbum> {
  const moments = parseDriveUrl(links.moments);
  const folder = parseDriveUrl(links.photos);

  const momentIds =
    moments?.kind === "file" ? [moments.id] : moments?.kind === "folder" ? dedupe(await listFolderImages(moments.id)).map((i) => i.id) : [];
  const folderId = folder?.kind === "folder" ? folder.id : null;
  const folderImages = folderId ? dedupe(await listFolderImages(folderId)) : folder?.kind === "file" ? [{ id: folder.id, name: folder.id }] : [];
  const folderIds = folderImages.map((i) => i.id);

  // Picks are saved per album: the Photos [All] folder, or the Moments link
  // when an event has no folder. They may include photos added by link.
  const albumKey = folderId ?? folder?.id ?? moments?.id ?? null;
  const hidden = new Set(albumKey ? (await readHidden())[albumKey] ?? [] : []);
  const best = (albumKey ? (await readPicks())[albumKey] ?? [] : []).filter((id) => !hidden.has(id));
  // The Moments picture leads unless an admin removed it; then the first pick does.
  const hero = momentIds.find((id) => !hidden.has(id)) ?? best[0] ?? null;

  const known = await loadScores();
  const scored = folderIds.every((id) => known[id]);
  if (!scored && folderId) void scoreFolder(folderId, folderImages);

  return {
    hero,
    best: best.filter((id) => id !== hero).slice(0, BEST_MAX),
    hidden: [...hidden],
    // Removed Moments pictures stay pickable, so an admin can bring them back.
    candidates: [...momentIds.filter((id) => hidden.has(id)), ...bestFirst(folderIds.filter((id) => id !== hero), known)],
    ranking: best.length ? "curated" : scored ? "unpicked" : "scoring",
    albumKey,
  };
}
