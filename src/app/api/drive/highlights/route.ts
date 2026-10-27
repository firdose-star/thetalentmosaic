/**
 * PUT /api/drive/highlights { albumKey, ids } — save the photos members see for
 * an event (up to 30, picked by an admin; an empty list shows none).
 * Stored in git-ignored data/event-highlights.json.
 *
 * ⚠️ No session check until real auth is switched on; then admins only.
 */
import { z } from "zod";

import { badRequest, ok } from "@/app/api/_lib/api-response";
import { isDriveId } from "@/lib/drive";
import { BEST_MAX, savePicks } from "@/lib/drive/album";

const bodySchema = z.object({
  albumKey: z.string().refine(isDriveId),
  ids: z.array(z.string().refine(isDriveId)).max(BEST_MAX),
});

export async function PUT(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Invalid highlights", body.error.issues);
  await savePicks(body.data.albumKey, body.data.ids);
  return ok({ saved: body.data.ids.length });
}
