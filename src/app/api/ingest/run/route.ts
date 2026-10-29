/**
 * GET | POST /api/ingest/run?source=all|greenhouse|lever|ashby|yc|hn
 *
 * The scheduled collection (vercel.json, 08:00 IST). Requires
 * `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron calls with GET, so both
 * methods run it. Each run reads at most 60 new postings; the rest wait for
 * the next run.
 */
import { z } from "zod";

import { badRequest, ok, unauthorized } from "@/app/api/_lib/api-response";
import { isCronRequest } from "@/app/api/_lib/cron";
import { feedUnavailable, searchParamsOf } from "@/app/api/_lib/roles-access";
import { runIngest } from "@/lib/roles/ingest";
import { COLLECTOR_KINDS } from "@/types/roles";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const querySchema = z.object({ source: z.enum(["all", ...COLLECTOR_KINDS]).default("all") });

async function run(request: Request) {
  if (!isCronRequest(request)) return unauthorized();
  const query = querySchema.safeParse(searchParamsOf(request));
  if (!query.success) return badRequest("Unknown source", query.error.issues);
  try {
    return ok(await runIngest({ kind: query.data.source === "all" ? undefined : query.data.source }));
  } catch (error) {
    return feedUnavailable(error);
  }
}

export const GET = run;
export const POST = run;
