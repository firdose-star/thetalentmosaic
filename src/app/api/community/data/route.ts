/**
 * GET /api/community/data — the real community, read on the server from the
 * Mastersheet exports in `data/` (git-ignored: they hold personal details):
 *
 *   data/community-form.csv      → members
 *   data/community-catchups.csv  → events
 *   data/vendor-form.csv         → Library vendors
 *
 * Each path can be overridden with COMMUNITY_FORM_CSV, CATCHUPS_CSV and
 * VENDOR_FORM_CSV. Missing files simply mean that section starts empty.
 *
 * ⚠️ Until real authentication is switched on (NEXT_PUBLIC_AUTH_ENABLED), this
 * route has no session check — fine on a laptop, not on a public URL. When
 * MongoDB and auth land, these records move into the database and this route
 * only answers signed-in users, with contact details for admins only.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { importMastersheet } from "@/lib/community-import";

export const dynamic = "force-dynamic";

const read = (file: string) => readFile(file, "utf8").catch(() => undefined);

export async function GET() {
  const dir = path.join(process.cwd(), "data");
  const [form, catchups, vendors] = await Promise.all([
    read(process.env.COMMUNITY_FORM_CSV ?? path.join(dir, "community-form.csv")),
    read(process.env.CATCHUPS_CSV ?? path.join(dir, "community-catchups.csv")),
    read(process.env.VENDOR_FORM_CSV ?? path.join(dir, "vendor-form.csv")),
  ]);

  if (!form && !catchups && !vendors) {
    return NextResponse.json({ source: "empty" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(importMastersheet({ form, catchups, vendors }), { headers: { "Cache-Control": "no-store" } });
}
