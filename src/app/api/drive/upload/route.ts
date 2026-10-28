/**
 * POST /api/drive/upload (multipart, field "photos") — admins upload event
 * photos from their computer. Each becomes a JPEG in git-ignored
 * data/uploads/ with an "up-" id; the caller then adds the ids to the event's
 * photos with PUT /api/drive/highlights. See src/lib/drive/uploads.ts.
 *
 * ⚠️ No session check until real auth is switched on; then admins only.
 */
import { badRequest, ok } from "@/app/api/_lib/api-response";
import { BEST_MAX } from "@/lib/drive/album";
import { saveUpload } from "@/lib/drive/uploads";

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const files = (form?.getAll("photos") ?? []).filter((f): f is File => f instanceof File);
  if (files.length === 0) return badRequest("Choose one or more photos");
  if (files.length > BEST_MAX) return badRequest(`Upload at most ${BEST_MAX} photos at a time`);

  const ids: string[] = [];
  const rejected: string[] = [];
  for (const file of files) {
    const id =
      file.size <= MAX_BYTES && file.type.startsWith("image/")
        ? await saveUpload(Buffer.from(await file.arrayBuffer()))
        : null;
    if (id) ids.push(id);
    else rejected.push(file.name);
  }
  return ok({ ids, rejected });
}
