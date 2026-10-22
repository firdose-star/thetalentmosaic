/**
 * Opportunities API calls (spec §8).
 *
 * The scraper feeds the CRM; this reads the published board. Members only
 * ever receive active listings — expired and in-review listings are admin
 * only (spec §8.8). Computed from the SAMPLE feed until the API exists.
 */
import { JOBS, SCRAPER_STATUS } from "@/lib/sample-data";
import type { JobListing } from "@/types/community";
import type { Role } from "@/types/enums";

export const opportunitiesService = {
  list: async (role: Role): Promise<JobListing[]> =>
    JOBS.filter((job) => role === "admin" || job.status === "active"),

  detail: async (id: string): Promise<JobListing | null> =>
    JOBS.find((job) => job.id === id && job.status === "active") ?? null,

  /** Admin only. */
  scraper: async () => ({
    ...SCRAPER_STATUS,
    counts: {
      active: JOBS.filter((j) => j.status === "active").length,
      expired: JOBS.filter((j) => j.status === "expired").length,
      review: JOBS.filter((j) => j.status === "review").length,
    },
    inactive: JOBS.filter((j) => j.status !== "active"),
  }),
};
