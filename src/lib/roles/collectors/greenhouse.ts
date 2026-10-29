/** Greenhouse public job board API — one company per slug. */
import { fetchJson } from "../http";
import { htmlToText } from "../text";
import type { CollectorTarget, RawRecord } from "./types";

interface GreenhouseJob {
  title: string;
  location?: { name?: string };
  content?: string;
  absolute_url: string;
  updated_at?: string;
  company_name?: string;
}

export async function collectGreenhouse({ slug, companyName }: CollectorTarget): Promise<RawRecord[]> {
  if (!slug) throw new Error("greenhouse: missing slug");
  const { jobs } = await fetchJson<{ jobs: GreenhouseJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`,
    // One response carries every posting's full text — big boards (900+ roles) need longer than 10 s.
    { timeoutMs: 30_000 },
  );
  return jobs.map((job) => ({
    source: "greenhouse",
    url: job.absolute_url,
    companyName: companyName ?? job.company_name ?? slug,
    title: job.title,
    rawText: `${job.title}\nLocation: ${job.location?.name ?? "not stated"}\n\n${htmlToText(job.content ?? "")}`,
    postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
    meta: { location: job.location?.name },
  }));
}
