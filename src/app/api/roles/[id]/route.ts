/**
 * GET /api/roles/[id] — one approved role. Same access and stripping rules
 * as the list: hidden, unverified and expired roles answer 404.
 */
import { notFound, ok, unauthorized } from "@/app/api/_lib/api-response";
import { feedUnavailable, mayListRoles, maySeeContacts } from "@/app/api/_lib/roles-access";
import { getCaller } from "@/app/api/_lib/session";
import { getApproved } from "@/lib/db/mongodb/roles.repository";
import { toListing } from "@/lib/roles/serialize";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteContext<"/api/roles/[id]">) {
  const caller = await getCaller(request);
  if (!mayListRoles(caller)) return unauthorized("Sign in to see roles");
  const { id } = await params;
  try {
    const doc = await getApproved(id);
    if (!doc) return notFound("This role is no longer available");
    return ok(toListing(doc, { contact: maySeeContacts(caller), admin: false }));
  } catch (error) {
    return feedUnavailable(error);
  }
}
