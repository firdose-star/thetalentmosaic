import type { CollectorKind } from "@/types/roles";

import { collectAshby } from "./ashby";
import { collectGreenhouse } from "./greenhouse";
import { collectHn } from "./hn";
import { collectLever } from "./lever";
import { collectLinkedIn, enrichLinkedIn } from "./linkedin";
import type { CollectorTarget, RawRecord } from "./types";
import { collectYc } from "./yc";

export type { CollectorTarget, RawRecord } from "./types";

export const COLLECTORS: Record<CollectorKind, (target: CollectorTarget) => Promise<RawRecord[]>> = {
  greenhouse: collectGreenhouse,
  lever: collectLever,
  ashby: collectAshby,
  yc: collectYc,
  hn: collectHn,
  linkedin: collectLinkedIn,
};

/** Sources whose listing is a summary: the full posting is fetched only for postings the feed will read. */
export const ENRICH: Partial<Record<CollectorKind, (record: RawRecord) => Promise<RawRecord>>> = {
  linkedin: enrichLinkedIn,
};
