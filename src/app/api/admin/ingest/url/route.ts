/**
 * POST /api/admin/ingest/url { url, pastedText? } — "Add from URL".
 *
 * Reads the page on the server; a login wall (LinkedIn usually is one) or a
 * failed fetch with no pasted text answers 422 so the admin pastes the post.
 * The role is saved `unverified` and returned for review. Admins only.
 */
import { badRequest, fail, ok, unauthorized } from "@/app/api/_lib/api-response";
import { feedUnavailable } from "@/app/api/_lib/roles-access";
import { getCaller, isAdmin } from "@/app/api/_lib/session";
import { ingestUrlSchema } from "@/features/opportunities/schemas";
import { ingestUrl } from "@/lib/roles/ingest";
import { toListing } from "@/lib/roles/serialize";
import { API_ERROR_CODES } from "@/types/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isAdmin(await getCaller(request))) return unauthorized("Admins only");
  const body = ingestUrlSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Check the link", body.error.issues);
  try {
    const result = await ingestUrl(body.data.url, body.data.pastedText);
    if (!result) return fail(422, API_ERROR_CODES.validation, "Could not read the page — paste the post text");
    return ok(toListing(result.doc, { contact: true, admin: true }), undefined, result.outcome === "inserted" ? 201 : 200);
  } catch (error) {
    return feedUnavailable(error);
  }
}
