import type { CollectorKind } from "@/types/roles";

import { collectAshby } from "./ashby";
import { collectGreenhouse } from "./greenhouse";
import { collectHn } from "./hn";
import { collectLever } from "./lever";
import type { CollectorTarget, RawRecord } from "./types";
import { collectYc } from "./yc";

export type { CollectorTarget, RawRecord } from "./types";

export const COLLECTORS: Record<CollectorKind, (target: CollectorTarget) => Promise<RawRecord[]>> = {
  greenhouse: collectGreenhouse,
  lever: collectLever,
  ashby: collectAshby,
  yc: collectYc,
  hn: collectHn,
};
