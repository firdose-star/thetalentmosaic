/**
 * Event photos uploaded by admins (rather than picked from Drive). Each upload
 * is stored once as a JPEG — auto-rotated, at most 2400px — in git-ignored
 * data/uploads/, and gets an id starting "up-" that works everywhere a Drive
 * id does (the album, the picks, /api/drive/image).
 */
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const DIR = path.join(process.cwd(), "data", "uploads");
const UPLOAD_ID = /^up-[a-f0-9]{20}$/;

export const isUploadId = (id: string) => UPLOAD_ID.test(id);

/** Store an uploaded image; returns its id, or null if it isn't a readable image. */
export async function saveUpload(bytes: Buffer): Promise<string | null> {
  const jpeg = await sharp(bytes)
    .rotate()
    .resize(2400, 2400, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer()
    .catch(() => null);
  if (!jpeg) return null;
  const id = `up-${randomBytes(10).toString("hex")}`;
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${id}.jpg`), jpeg);
  return id;
}

/** An uploaded photo at a given longest edge, resized once and cached beside it. */
export async function uploadImage(id: string, maxEdge: number): Promise<Buffer | null> {
  if (!isUploadId(id)) return null;
  const sized = path.join(DIR, `${id}-${maxEdge}.jpg`);
  const cached = await readFile(sized).catch(() => null);
  if (cached) return cached;
  const original = await readFile(path.join(DIR, `${id}.jpg`)).catch(() => null);
  if (!original) return null;
  const bytes = await sharp(original).resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  await writeFile(sized, bytes);
  return bytes;
}
