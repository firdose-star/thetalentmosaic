/**
 * Server-only helpers for the event photos kept in Google Drive.
 *
 * The Community Catchups tab links each event to a "Moments" file (or folder)
 * and a "Photos [All]" folder, shared as "Anyone with the link". Drive's public
 * embedded folder view lists a folder's files without an API key, and its
 * thumbnail endpoint renders any image — RAW camera files (.NEF) included — as
 * a JPEG. The app shows those images itself, through /api/drive/image, so
 * nobody is sent off to Drive.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** A Drive file or folder id. */
const ID = /^[A-Za-z0-9_-]{10,}$/;

export const isDriveId = (id: string) => ID.test(id);

/** A Drive link → what it points at. */
export function parseDriveUrl(url?: string | null): { kind: "file" | "folder"; id: string } | null {
  if (!url) return null;
  const folder = url.match(/\/folders\/([A-Za-z0-9_-]{10,})/);
  if (folder) return { kind: "folder", id: folder[1] };
  const file = url.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/) ?? url.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return file ? { kind: "file", id: file[1] } : null;
}

export interface DriveImage {
  id: string;
  name: string;
}

const IMAGE = /\.(jpe?g|png|webp|heic|heif|nef|cr2|cr3|arw|dng|raf|orf|rw2|tiff?)$/i;
const LIST_TTL_MS = 60 * 60 * 1000;
const listCache = new Map<string, { at: number; images: DriveImage[] }>();

async function listOnce(folderId: string) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Drive folder ${folderId}: HTTP ${res.status}`);
  const html = await res.text();
  const files: DriveImage[] = [];
  const folders: string[] = [];
  const entry = /<div class="flip-entry" id="entry-([A-Za-z0-9_-]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?class="flip-entry-title">([^<]*)</g;
  for (const [, id, href, name] of html.matchAll(entry)) {
    if (href.includes("/folders/")) folders.push(id);
    else if (IMAGE.test(name)) files.push({ id, name });
  }
  return { files, folders };
}

/**
 * Every image in a public folder, its subfolders included (two levels deep),
 * in name order — the order the camera took them. Cached for an hour.
 */
export async function listFolderImages(folderId: string): Promise<DriveImage[]> {
  const hit = listCache.get(folderId);
  if (hit && Date.now() - hit.at < LIST_TTL_MS) return hit.images;

  const images: DriveImage[] = [];
  let level = [folderId];
  for (let depth = 0; depth < 3 && level.length; depth++) {
    const results = await Promise.all(level.map(listOnce));
    images.push(...results.flatMap((r) => r.files));
    level = results.flatMap((r) => r.folders);
  }
  images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  listCache.set(folderId, { at: Date.now(), images });
  return images;
}

/** Sizes served by /api/drive/image (longest edge, px). */
export const IMAGE_SIZES = { thumb: 480, large: 1600 } as const;
export type ImageSize = keyof typeof IMAGE_SIZES;

/** Downloaded images live here (git-ignored with the rest of data/). */
const CACHE_DIR = path.join(process.cwd(), "data", ".drive-cache");

/** One Drive image as JPEG bytes, fetched once and then served from disk. */
export async function driveImage(id: string, size: ImageSize): Promise<Buffer | null> {
  const file = path.join(CACHE_DIR, `${id}-${size}.jpg`);
  const cached = await readFile(file).catch(() => null);
  if (cached) return cached;

  const res = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w${IMAGE_SIZES[size]}`, { cache: "no-store" });
  if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, bytes);
  return bytes;
}
