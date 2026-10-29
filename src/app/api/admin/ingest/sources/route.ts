/**
 * GET  /api/admin/ingest/sources — the boards the feed polls, and the last 20 runs.
 * POST /api/admin/ingest/sources { kind, slug, companyName? } — poll another board.
 *
 * Admins only.
 */
import { MongoServerError } from "mongodb";

import { badRequest, fail, ok, unauthorized } from "@/app/api/_lib/api-response";
import { feedUnavailable } from "@/app/api/_lib/roles-access";
import { getCaller, isAdmin } from "@/app/api/_lib/session";
import { ingestSourceSchema } from "@/features/opportunities/schemas";
import { addSource, listSources, recentRuns } from "@/lib/db/mongodb/ingest.repository";
import { toIngestRun, toIngestSource } from "@/lib/roles/serialize";
import { API_ERROR_CODES } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdmin(await getCaller(request))) return unauthorized("Admins only");
  try {
    const [sources, runs] = await Promise.all([listSources(), recentRuns(20)]);
    return ok({ sources: sources.map(toIngestSource), runs: runs.map(toIngestRun) });
  } catch (error) {
    return feedUnavailable(error);
  }
}

export async function POST(request: Request) {
  if (!isAdmin(await getCaller(request))) return unauthorized("Admins only");
  const body = ingestSourceSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Check the board details", body.error.issues);
  try {
    return ok(toIngestSource(await addSource(body.data)), undefined, 201);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return fail(409, API_ERROR_CODES.conflict, "That board is already on the list.");
    }
    return feedUnavailable(error);
  }
}
