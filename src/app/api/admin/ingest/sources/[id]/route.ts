/**
 * PATCH /api/admin/ingest/sources/[id] { enabled } — switch a board on or off.
 * Admins only.
 */
import { z } from "zod";

import { badRequest, notFound, ok, unauthorized } from "@/app/api/_lib/api-response";
import { feedUnavailable } from "@/app/api/_lib/roles-access";
import { getCaller, isAdmin } from "@/app/api/_lib/session";
import { setSourceEnabled } from "@/lib/db/mongodb/ingest.repository";
import { toIngestSource } from "@/lib/roles/serialize";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ enabled: z.boolean() });

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/ingest/sources/[id]">) {
  if (!isAdmin(await getCaller(request))) return unauthorized("Admins only");
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Expected { enabled: boolean }", body.error.issues);
  const { id } = await params;
  try {
    const doc = await setSourceEnabled(id, body.data.enabled);
    return doc ? ok(toIngestSource(doc)) : notFound("Board not found");
  } catch (error) {
    return feedUnavailable(error);
  }
}
