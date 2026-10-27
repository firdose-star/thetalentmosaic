/**
 * Job board status. Listings come from the job-scraping feed (not connected
 * yet) or are added by admins; there are no sample listings.
 */
export interface ScraperStatus {
  connected: boolean;
  lastSuccessfulRun: string | null;
  sources: { name: string; status: "ok" | "warning"; listings: number }[];
  brokenLinks: { jobId: string; title: string; company: string; reason: string }[];
  duplicates: { title: string; company: string; sources: string[] }[];
  errors: { at: string; source: string; message: string }[];
}

export const SCRAPER_STATUS: ScraperStatus = {
  connected: false,
  lastSuccessfulRun: null,
  sources: [],
  brokenLinks: [],
  duplicates: [],
  errors: [],
};
