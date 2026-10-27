/**
 * GET /api/community/members — the real community, read from the Community
 * Form export on the server.
 *
 * The CSV lives in `data/` (git-ignored: it holds personal details), or at
 * COMMUNITY_CSV_PATH. When it's missing the app falls back to sample data.
 *
 * ⚠️ Until real authentication is switched on (NEXT_PUBLIC_AUTH_ENABLED), this
 * route has no session check — fine on a laptop, not on a public URL. When
 * MongoDB and auth land, members move into the database and this route only
 * answers signed-in users, with contact details for admins only.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { importCommunityForm } from "@/lib/community-import/parse";

export const dynamic = "force-dynamic";

export async function GET() {
  const file = process.env.COMMUNITY_CSV_PATH ?? path.join(process.cwd(), "data", "community-form.csv");

  let csv: string;
  try {
    csv = await readFile(file, "utf8");
  } catch {
    return NextResponse.json({ source: "sample" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const result = importCommunityForm(csv);
  return NextResponse.json({ source: "community-form", ...result }, { headers: { "Cache-Control": "no-store" } });
}
