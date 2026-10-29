/**
 * LinkedIn Jobs, through the public job search LinkedIn shows signed-out
 * visitors — no account, no login. One board = one keyword search in India,
 * last 60 days, first two pages (50 results).
 *
 * The search gives title, company, location, date and link; the full posting
 * (and the company's one-line description) is fetched only for postings the
 * feed hasn't seen, in `enrichLinkedIn`, so a daily run stays at a few dozen
 * requests. LinkedIn rate-limits signed-out traffic: requests go two at a
 * time with a pause, at most 25 new per run, and a refusal is recorded as a run
 * error, never retried in a loop.
 */
import { fetchWithRetry } from "../http";
import { decodeEntities, htmlToText } from "../text";
import type { CollectorTarget, RawRecord } from "./types";

const SEARCH = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";
const POSTING = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting";
const SIXTY_DAYS_S = 60 * 86_400;
const PAGES = [0, 25];

const text = (html?: string) => (html ? decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() : undefined);

async function page(keywords: string, start: number) {
  const query = new URLSearchParams({ keywords, location: "India", f_TPR: `r${SIXTY_DAYS_S}`, start: String(start) });
  const response = await fetchWithRetry(`${SEARCH}?${query}`, { headers: { Accept: "text/html" } }, { retries: 1 });
  if (!response.ok) throw new Error(`linkedin search "${keywords}": HTTP ${response.status}`);
  return response.text();
}

function parseCards(html: string): RawRecord[] {
  return html.split("<li>").slice(1).flatMap((card) => {
    const id = card.match(/urn:li:jobPosting:(\d+)/)?.[1];
    const title = text(card.match(/base-search-card__title[^>]*>([\s\S]*?)<\/h3>/)?.[1]);
    if (!id || !title) return [];
    const company = text(card.match(/base-search-card__subtitle[^>]*>([\s\S]*?)<\/h4>/)?.[1]);
    const companyUrl = card.match(/base-search-card__subtitle[\s\S]*?href="([^"?]+)/)?.[1];
    const location = text(card.match(/job-search-card__location[^>]*>([\s\S]*?)<\/span>/)?.[1]);
    const date = card.match(/<time[^>]*datetime="([^"]+)"/)?.[1];
    const logo = card.match(/data-delayed-url="(https:\/\/media\.licdn\.com[^"]+company-logo[^"]+)"/)?.[1];
    return [{
      source: "linkedin" as const,
      // The canonical job link, without LinkedIn's tracking parameters.
      url: `https://www.linkedin.com/jobs/view/${id}`,
      companyName: company,
      title,
      rawText: `${title}\n${company ?? ""}\nLocation: ${location ?? "not stated"}`,
      postedAt: date ? new Date(date) : undefined,
      meta: { location, companyUrl, logoUrl: logo ? decodeEntities(logo) : undefined },
    }];
  });
}

export async function collectLinkedIn({ slug }: CollectorTarget): Promise<RawRecord[]> {
  if (!slug) throw new Error("linkedin: missing search keywords");
  const pages = await Promise.all(PAGES.map((start) => page(slug, start).catch((error) => (start === 0 ? Promise.reject(error) : ""))));
  return [...new Map(pages.flatMap(parseCards).map((r) => [r.url, r])).values()];
}

/** The company's own one-line description, from its public LinkedIn page. */
const aboutCache = new Map<string, Promise<string | undefined>>();

/** Cached per server process — the same companies post many roles. */
function companyAbout(companyUrl?: string) {
  if (!companyUrl) return Promise.resolve(undefined);
  if (!aboutCache.has(companyUrl)) aboutCache.set(companyUrl, fetchCompanyAbout(companyUrl));
  return aboutCache.get(companyUrl)!;
}

async function fetchCompanyAbout(companyUrl: string) {
  // English, or LinkedIn answers in the company's home language.
  const response = await fetchWithRetry(companyUrl, { headers: { Accept: "text/html", "Accept-Language": "en-US,en;q=0.9" } }, { retries: 0 }).catch(() => null);
  if (!response?.ok) return undefined;
  const og = (await response.text()).match(/<meta property="og:description" content="([^"]*)"/)?.[1];
  if (!og) return undefined;
  // "Name | 623,300 followers on LinkedIn. Tagline | About text…" — entities come double-encoded.
  const parts = decodeEntities(decodeEntities(og)).split(" | ");
  const about = (parts.length > 2 ? parts.slice(2).join(" | ") : (parts[1] ?? ""))
    .replace(/^[\d,.\s  ]+[^.]*(followers|abonnés|follower:innen|seguidores)[^.]*\.\s*/i, "")
    .trim();
  return about || undefined;
}

/** A search card → the full posting: description, criteria, and the company's About. */
export async function enrichLinkedIn(record: RawRecord): Promise<RawRecord> {
  const id = record.url.split("/").pop();
  const [response, about] = await Promise.all([
    fetchWithRetry(`${POSTING}/${id}`, { headers: { Accept: "text/html" } }, { retries: 1 }),
    companyAbout(record.meta?.companyUrl),
  ]);
  if (!response.ok) throw new Error(`linkedin posting ${id}: HTTP ${response.status}`);
  const html = await response.text();
  const description = htmlToText(html.match(/show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "");
  const criteria = [...html.matchAll(/description__job-criteria-subheader[^>]*>([\s\S]*?)<\/h3>[\s\S]*?description__job-criteria-text[^>]*>([\s\S]*?)<\/span>/g)]
    .map(([, k, v]) => `${text(k)}: ${text(v)}`);
  const commitment = criteria.find((c) => c.startsWith("Employment type"))?.split(": ")[1];
  return {
    ...record,
    rawText: [record.rawText, criteria.join("\n"), about ? `About ${record.companyName ?? "the company"}: ${about}` : "", description].filter(Boolean).join("\n\n"),
    meta: { ...record.meta, commitment, about },
  };
}
