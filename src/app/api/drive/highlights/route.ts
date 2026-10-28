/**
 * PUT /api/drive/highlights { albumKey, ids, hidden? } — save the photos
 * members see for an event (up to 30, picked or uploaded by an admin; an empty
 * list shows none), and optionally the photos an admin removed that would
 * otherwise show, such as the Moments picture. Stored in git-ignored
 * data/event-highlights.json and data/event-hidden.json.
 *
 * ⚠️ No session check until real auth is switched on; then admins only.
 */
import { z } from "zod";

import { badRequest, ok } from "@/app/api/_lib/api-response";
import { isDriveId } from "@/lib/drive";
import { BEST_MAX, saveHidden, savePicks } from "@/lib/drive/album";

const photoId = z.string().refine(isDriveId);

const bodySchema = z.object({
  albumKey: photoId,
  ids: z.array(photoId).max(BEST_MAX),
  hidden: z.array(photoId).max(200).optional(),
});

export async function PUT(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Invalid photos", body.error.issues);
  await savePicks(body.data.albumKey, body.data.ids);
  if (body.data.hidden) await saveHidden(body.data.albumKey, body.data.hidden);
  return ok({ saved: body.data.ids.length });
}
