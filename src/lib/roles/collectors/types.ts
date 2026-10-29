import type { CollectorKind, RoleSourceKind } from "@/types/roles";

/** One posting as a source gave it, before extraction. */
export interface RawRecord {
  source: RoleSourceKind;
  url: string;
  companyName?: string;
  title?: string;
  /** Plain text — HTML is stripped before it gets here. */
  rawText: string;
  postedAt?: Date;
  posterName?: string;
  posterUrl?: string;
  /** Structured fields the source already gave, used when Claude isn't set up. */
  meta?: {
    location?: string;
    remote?: boolean;
    commitment?: string;
    salary?: string;
    companyUrl?: string;
    ycBatch?: string;
    logoUrl?: string;
  };
}

/** A board to poll, from the ingest_sources collection. */
export interface CollectorTarget {
  kind: CollectorKind;
  slug?: string;
  companyName?: string;
}
