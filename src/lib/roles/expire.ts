/**
 * Nightly expiry (spec §7). A live role expires when:
 *  - every source is a collector and none has listed it for 14 days, or
 *  - the team added it and its `expiresAt` has passed, or
 *  - its primary link now answers 404 / 410 (best effort, HEAD request).
 * Expired roles never reach members.
 */
import "server-only";

import {
  ensureRoleIndexes,
  expireManualPastDate,
  expireUnseen,
  liveForLinkCheck,
  markExpired,
} from "@/lib/db/mongodb/roles.repository";

import { fetchWithRetry, mapLimit } from "./http";

const LINK_CHECKS_PER_RUN = 100;

export async function runExpiry(now = new Date()) {
  await ensureRoleIndexes();
  const unseen = await expireUnseen(new Date(now.getTime() - 14 * 864e5), now);
  const pastDate = await expireManualPastDate(now);

  const live = await liveForLinkCheck(LINK_CHECKS_PER_RUN);
  const gone = await mapLimit(live, 4, async (role) => {
    const url = role.sources[0]?.url;
    if (!url) return null;
    const response = await fetchWithRetry(url, { method: "HEAD", redirect: "follow" }, { retries: 1 });
    return response.status === 404 || response.status === 410 ? role._id : null;
  });
  const deadLinks = await markExpired(gone.filter((id) => id !== null), now);

  console.info(`[ingest] expiry unseen=${unseen} pastDate=${pastDate} deadLinks=${deadLinks} checked=${live.length}`);
  return { unseen, pastDate, deadLinks, checked: live.length };
}
