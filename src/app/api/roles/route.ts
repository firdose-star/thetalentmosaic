/**
 * GET /api/roles — approved roles for the Opportunities board.
 *
 * Members only (or anyone when ROLES_PUBLIC_LIST=true). `contact` is stripped
 * unless the caller may see it; `rawText` is never sent. `meta.cities` feeds
 * the Location filter.
 */
import { badRequest, ok, unauthorized } from "@/app/api/_lib/api-response";
import { feedUnavailable, mayListRoles, maySeeContacts, rolesQuerySchema, searchParamsOf } from "@/app/api/_lib/roles-access";
import { getCaller } from "@/app/api/_lib/session";
import { approvedCities, listApproved } from "@/lib/db/mongodb/roles.repository";
import { toListing } from "@/lib/roles/serialize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const caller = await getCaller(request);
  if (!mayListRoles(caller)) return unauthorized("Sign in to see roles");

  const query = rolesQuerySchema.safeParse(searchParamsOf(request));
  if (!query.success) return badRequest("Invalid filters", query.error.issues);
  const { remote, ...q } = query.data;

  try {
    const [{ docs, total }, cities] = await Promise.all([listApproved({ ...q, remote: remote === "true" }), approvedCities()]);
    const contact = maySeeContacts(caller);
    return ok(docs.map((d) => toListing(d, { contact, admin: false })), {
      total,
      page: q.page,
      pageSize: q.pageSize,
      cities,
    });
  } catch (error) {
    return feedUnavailable(error);
  }
}
