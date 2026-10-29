/**
 * Cron routes accept exactly `Authorization: Bearer ${CRON_SECRET}` — which
 * Vercel Cron sends on its own once CRON_SECRET is set. No secret configured
 * means no caller is ever accepted. SERVER ONLY.
 */
import "server-only";

import { timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/lib/config/env";

export function isCronRequest(request: Request): boolean {
  const secret = getServerEnv().CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
