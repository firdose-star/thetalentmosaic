/**
 * Event photos, served by this app from the Google Drive links on each event
 * (see src/lib/drive). Same-origin Route Handlers, like community-data.ts.
 */
export interface EventAlbum {
  hero: string | null;
  /** The hand-picked photos members see (up to 30). */
  best: string[];
  /** Admin picking only: the whole folder, best-scored first, burst shots left out. */
  candidates: string[];
  /** Removed by an admin (e.g. the Moments picture); kept so they can be restored. */
  hidden: string[];
  ranking: "curated" | "unpicked" | "scoring";
  /** Where an admin's picks are saved. */
  albumKey: string | null;
}

/** Most photos an event shows. */
export const BEST_MAX = 30;

export type PhotoSize = "thumb" | "large";

export const photoUrl = (id: string, size: PhotoSize = "thumb") => `/api/drive/image/${id}?size=${size}`;

export async function loadEventAlbum(links: { moments?: string; photos?: string }): Promise<EventAlbum> {
  const query = new URLSearchParams();
  if (links.moments) query.set("moments", links.moments);
  if (links.photos) query.set("photos", links.photos);
  const response = await fetch(`/api/drive/album?${query}`, { cache: "no-store" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? "Couldn't load the photos");
  }
  return (await response.json()) as EventAlbum;
}

export async function saveEventHighlights(albumKey: string, ids: string[], hidden?: string[]) {
  const response = await fetch("/api/drive/highlights", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ albumKey, ids, hidden }),
  });
  if (!response.ok) throw new Error("Couldn't save the photos");
}

/** Admin: upload photos from this computer; returns the new photo ids. */
export async function uploadEventPhotos(files: File[]): Promise<{ ids: string[]; rejected: string[] }> {
  const form = new FormData();
  for (const file of files) form.append("photos", file);
  const response = await fetch("/api/drive/upload", { method: "POST", body: form });
  const body = (await response.json().catch(() => null)) as { data?: { ids: string[]; rejected: string[] }; error?: { message?: string } } | null;
  if (!response.ok || !body?.data) throw new Error(body?.error?.message ?? "Couldn't upload the photos");
  return body.data;
}
