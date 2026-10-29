/**
 * PATCH  /api/admin/roles/[id] — edit any field, or set the status. Approving
 *        records who approved it and when.
 * DELETE /api/admin/roles/[id] — hard delete.
 *
 * Admins only.
 */
import { MongoServerError } from "mongodb";

import { badRequest, fail, noContent, notFound, ok, unauthorized } from "@/app/api/_lib/api-response";
import { feedUnavailable } from "@/app/api/_lib/roles-access";
import { getCaller, isAdmin } from "@/app/api/_lib/session";
import { rolePatchSchema } from "@/features/opportunities/schemas";
import { deleteRole, getAny, updateRole } from "@/lib/db/mongodb/roles.repository";
import { patchUpdate } from "@/lib/roles/input";
import { toListing } from "@/lib/roles/serialize";
import { API_ERROR_CODES } from "@/types/api";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/roles/[id]">) {
  const caller = await getCaller(request);
  if (!isAdmin(caller)) return unauthorized("Admins only");
  const body = rolePatchSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Check the highlighted fields", body.error.issues);
  const { id } = await params;
  try {
    const existing = await getAny(id);
    if (!existing) return notFound("Role not found");
    const doc = await updateRole(id, patchUpdate(body.data, existing, new Date(), caller.name));
    return doc ? ok(toListing(doc, { contact: true, admin: true })) : notFound("Role not found");
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return fail(409, API_ERROR_CODES.conflict, "Another role already has this title, company and city.");
    }
    return feedUnavailable(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/roles/[id]">) {
  if (!isAdmin(await getCaller(request))) return unauthorized("Admins only");
  const { id } = await params;
  try {
    return (await deleteRole(id)) ? noContent() : notFound("Role not found");
  } catch (error) {
    return feedUnavailable(error);
  }
}
