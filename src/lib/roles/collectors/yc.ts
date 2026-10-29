/**
 * Y Combinator's public jobs pages. Listing pages carry their data as JSON in
 * a `data-page` attribute; each job page adds the full description. Only
 * pages that render without signing in are read.
 */
import { fetchWithRetry, mapLimit } from "../http";
import { decodeEntities } from "../text";
import type { RawRecord } from "./types";

const YC = "https://www.ycombinator.com";
/** The Recruiting & HR page, and India (which lists every role — the gate filters it). */
const LISTING_PAGES = ["/jobs/role/recruiting-hr", "/jobs/role/recruiting-hr/india"];

interface YcPosting {
  title: string;
  url: string;
  location?: string;
  type?: string;
  salaryRange?: string;
  minExperience?: string;
  companyName: string;
  companyBatchName?: string;
  companyUrl?: string;
  companyLogoUrl?: string;
  companyOneLiner?: string;
  prettyRole?: string;
  roleSpecificType?: string;
  createdAt?: string;
  description?: string;
}

async function pageProps(path: string): Promise<Record<string, unknown>> {
  const response = await fetchWithRetry(`${YC}${path}`, { headers: { Accept: "text/html" } });
  if (!response.ok) throw new Error(`yc ${path}: HTTP ${response.status}`);
  const raw = (await response.text()).match(/data-page="([^"]+)"/)?.[1];
  if (!raw) throw new Error(`yc ${path}: page data not found (layout changed?)`);
  return (JSON.parse(decodeEntities(raw)) as { props: Record<string, unknown> }).props;
}

const UNIT_MS = { minute: 6e4, hour: 36e5, day: 864e5, week: 6048e5, month: 2592e6, year: 31536e6 };

/** "3 months" / "8 days" → an approximate date. */
function agoToDate(ago?: string) {
  const m = ago?.match(/(\d+)\s*(minute|hour|day|week|month|year)/);
  return m ? new Date(Date.now() - Number(m[1]) * UNIT_MS[m[2] as keyof typeof UNIT_MS]) : undefined;
}

export async function collectYc(): Promise<RawRecord[]> {
  const listings = await Promise.all(LISTING_PAGES.map(async (p) => ((await pageProps(p)).jobPostings as YcPosting[]) ?? []));
  const unique = [...new Map(listings.flat().map((j) => [j.url, j])).values()];
  const detailed = await mapLimit(unique, 4, async (job) => ({ ...job, ...((await pageProps(job.url)).job as Partial<YcPosting>) }));
  return unique.map((job, i) => {
    const j = detailed[i] ?? job;
    return {
      source: "yc",
      url: `${YC}${j.url}`,
      companyName: j.companyName,
      title: j.title,
      rawText: [
        j.title,
        `${j.companyName}${j.companyBatchName ? ` (YC ${j.companyBatchName})` : ""}${j.companyOneLiner ? ` — ${j.companyOneLiner}` : ""}`,
        // YC's own category. The India page lists every role, so the gate still decides.
        `Category: ${[j.prettyRole, j.roleSpecificType].filter(Boolean).join(" · ") || "Recruiting & HR"}`,
        `Location: ${j.location ?? "not stated"}${j.type ? ` · ${j.type}` : ""}${j.salaryRange ? ` · ${j.salaryRange}` : ""}${j.minExperience ? ` · ${j.minExperience}` : ""}`,
        j.description ?? "",
      ].filter(Boolean).join("\n\n"),
      postedAt: agoToDate(j.createdAt),
      meta: {
        location: j.location,
        commitment: j.type,
        salary: j.salaryRange || undefined,
        companyUrl: j.companyUrl ? `${YC}${j.companyUrl}` : undefined,
        ycBatch: j.companyBatchName,
        logoUrl: j.companyLogoUrl,
      },
    };
  });
}
