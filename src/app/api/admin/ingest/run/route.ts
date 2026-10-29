/**
 * POST /api/admin/ingest/run?source=all|greenhouse|…&id= — the admin "Run now"
 * button. Runs the same pipeline as the cron route, in this request, so the
 * cron secret never has to reach the browser. Admins only.
 */
import { z } from "zod";

import { badRequest, ok, unauthorized } from "@/app/api/_lib/api-response";
import { feedUnavailable, searchParamsOf } from "@/app/api/_lib/roles-access";
import { getCaller, isAdmin } from "@/app/api/_lib/session";
import { runIngest } from "@/lib/roles/ingest";
import { COLLECTOR_KINDS } from "@/types/roles";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const querySchema = z.object({
  source: z.enum(["all", ...COLLECTOR_KINDS]).default("all"),
  id: z.string().regex(/^[a-f0-9]{24}$/).optional(),
});

export async function POST(request: Request) {
  if (!isAdmin(await getCaller(request))) return unauthorized("Admins only");
  const query = querySchema.safeParse(searchParamsOf(request));
  if (!query.success) return badRequest("Unknown source", query.error.issues);
  const { source, id } = query.data;
  try {
    return ok(await runIngest({ kind: source === "all" ? undefined : source, id }));
  } catch (error) {
    return feedUnavailable(error);
  }
}
