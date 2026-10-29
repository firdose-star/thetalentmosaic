/** Ashby public job board API — one company per slug. */
import { fetchJson } from "../http";
import type { CollectorTarget, RawRecord } from "./types";

interface AshbyJob {
  title: string;
  location?: string;
  isRemote?: boolean;
  workplaceType?: string;
  employmentType?: string;
  descriptionPlain?: string;
  jobUrl: string;
  publishedAt?: string;
  isListed?: boolean;
  compensation?: { compensationTierSummary?: string; scrapeableCompensationSalarySummary?: string };
}

export async function collectAshby({ slug, companyName }: CollectorTarget): Promise<RawRecord[]> {
  if (!slug) throw new Error("ashby: missing slug");
  const { jobs } = await fetchJson<{ jobs: AshbyJob[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`,
  );
  return jobs
    .filter((j) => j.isListed !== false)
    .map((j) => {
      const salary = j.compensation?.compensationTierSummary ?? j.compensation?.scrapeableCompensationSalarySummary;
      return {
        source: "ashby",
        url: j.jobUrl,
        companyName: companyName ?? slug,
        title: j.title,
        rawText: [
          j.title,
          `Location: ${j.location ?? "not stated"}${j.isRemote ? " · Remote" : ""}${j.employmentType ? ` · ${j.employmentType}` : ""}`,
          j.descriptionPlain ?? "",
          // After the description: the keyword gate reads the first 600 characters,
          // and "Compensation" there would let every posting through.
          salary ? `Pay: ${salary}` : "",
        ].filter(Boolean).join("\n\n"),
        postedAt: j.publishedAt ? new Date(j.publishedAt) : undefined,
        meta: { location: j.location, remote: j.isRemote || j.workplaceType === "Remote", commitment: j.employmentType, salary },
      };
    });
}
