/**
 * GET | POST /api/ingest/expire — the nightly expiry job (vercel.json, 08:30
 * IST). Requires `Authorization: Bearer ${CRON_SECRET}`.
 */
import { ok, unauthorized } from "@/app/api/_lib/api-response";
import { isCronRequest } from "@/app/api/_lib/cron";
import { feedUnavailable } from "@/app/api/_lib/roles-access";
import { runExpiry } from "@/lib/roles/expire";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function run(request: Request) {
  if (!isCronRequest(request)) return unauthorized();
  try {
    return ok(await runExpiry());
  } catch (error) {
    return feedUnavailable(error);
  }
}

export const GET = run;
export const POST = run;
