/**
 * GET  /api/admin/roles?status=&q=&page= — the Listing management queue: any
 *      status, with contact and extraction details. `meta.counts` per status.
 * POST /api/admin/roles — "Add a role": the team's own listing, `manual` source.
 *
 * Admins only.
 */
import { MongoServerError } from "mongodb";

import { badRequest, fail, ok, unauthorized } from "@/app/api/_lib/api-response";
import { adminRolesQuerySchema, feedUnavailable, searchParamsOf } from "@/app/api/_lib/roles-access";
import { getCaller, isAdmin } from "@/app/api/_lib/session";
import { roleInputSchema } from "@/features/opportunities/schemas";
import { countByStatus, ensureRoleIndexes, insertRole, listForAdmin } from "@/lib/db/mongodb/roles.repository";
import { newManualRole } from "@/lib/roles/input";
import { toListing } from "@/lib/roles/serialize";
import { API_ERROR_CODES } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdmin(await getCaller(request))) return unauthorized("Admins only");
  const query = adminRolesQuerySchema.safeParse(searchParamsOf(request));
  if (!query.success) return badRequest("Invalid filters", query.error.issues);
  const { status, ...q } = query.data;
  try {
    const [{ docs, total }, counts] = await Promise.all([listForAdmin(status, q), countByStatus()]);
    return ok(docs.map((d) => toListing(d, { contact: true, admin: true })), { total, page: q.page, pageSize: q.pageSize, counts });
  } catch (error) {
    return feedUnavailable(error);
  }
}

export async function POST(request: Request) {
  const caller = await getCaller(request);
  if (!isAdmin(caller)) return unauthorized("Admins only");
  const body = roleInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Check the highlighted fields", body.error.issues);
  try {
    await ensureRoleIndexes();
    const doc = await insertRole(newManualRole(body.data, new Date(), caller.name));
    return ok(toListing(doc, { contact: true, admin: true }), undefined, 201);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return fail(409, API_ERROR_CODES.conflict, "This role is already in the feed — find it in Listing management.");
    }
    return feedUnavailable(error);
  }
}
