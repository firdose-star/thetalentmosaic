/**
 * GET /api/drive/album?moments=<Drive link>&photos=<Drive link> — an event's
 * photos: the hero (Moments), the hand-picked best, and (for admins) the rest. See
 * src/lib/drive/album.ts. Only Google Drive links are accepted.
 */
import { NextResponse, type NextRequest } from "next/server";

import { badRequest, serverError } from "@/app/api/_lib/api-response";
import { parseDriveUrl } from "@/lib/drive";
import { buildAlbum } from "@/lib/drive/album";

export const dynamic = "force-dynamic";

const driveLink = (value: string | null) =>
  value && /^https:\/\/drive\.google\.com\//.test(value) && parseDriveUrl(value) ? value : null;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const moments = driveLink(query.get("moments"));
  const photos = driveLink(query.get("photos"));
  if (!moments && !photos) return badRequest("Pass a Google Drive link as moments or photos");

  try {
    return NextResponse.json(await buildAlbum({ moments, photos }), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return serverError("Couldn't read the Drive folder — is it shared as 'Anyone with the link'?");
  }
}
