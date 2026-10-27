/**
 * GET /api/drive/image/:id?size=thumb|large — one event photo from Google
 * Drive, served from this app (and cached on disk after the first view), so
 * the Events pages never send anyone to Drive.
 *
 * ⚠️ Like /api/community/data, this has no session check until real auth is
 * switched on — fine on a laptop, not on a public URL.
 */
import { NextResponse, type NextRequest } from "next/server";

import { badRequest, notFound } from "@/app/api/_lib/api-response";
import { IMAGE_SIZES, driveImage, isDriveId, type ImageSize } from "@/lib/drive";

export async function GET(request: NextRequest, { params }: RouteContext<"/api/drive/image/[id]">) {
  const { id } = await params;
  const size = (request.nextUrl.searchParams.get("size") ?? "thumb") as ImageSize;
  if (!isDriveId(id) || !(size in IMAGE_SIZES)) return badRequest("Unknown image");

  const bytes = await driveImage(id, size).catch(() => null);
  if (!bytes) return notFound("Image not available");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      // A Drive id always names the same file.
      "Cache-Control": "private, max-age=604800, immutable",
    },
  });
}
