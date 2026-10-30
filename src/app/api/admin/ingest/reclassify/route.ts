/**
 * POST /api/admin/ingest/reclassify — re-read company type, years of
 * experience and employment type for every stored role (after the rules
 * change). Fills only what is missing or unclear. Admins only.
 */
import { ok, unauthorized } from "@/app/api/_lib/api-response";
import { feedUnavailable } from "@/app/api/_lib/roles-access";
import { getCaller, isAdmin } from "@/app/api/_lib/session";
import { reclassifyRoles } from "@/lib/roles/reclassify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isAdmin(await getCaller(request))) return unauthorized("Admins only");
  try {
    return ok(await reclassifyRoles());
  } catch (error) {
    return feedUnavailable(error);
  }
}
