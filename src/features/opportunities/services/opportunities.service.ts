/**
 * Opportunities API calls (spec §8).
 *
 * Listings come from the job-scraping feed once it is connected; until then
 * admins add, edit and remove them by hand. Members only ever receive active
 * listings — expired and in-review listings are admin only (spec §8.8).
 */
import { SCRAPER_STATUS, communityStore, logAdminAction } from "@/lib/sample-data";
import type { JobListing } from "@/types/community";
import type { Role } from "@/types/enums";

import type { JobInput } from "../schemas";

const toListing = (input: JobInput, id: string, existing?: JobListing): JobListing => ({
  id,
  title: input.title,
  company: input.company,
  location: input.location,
  hrFunction: input.hrFunction,
  seniority: input.seniority,
  arrangement: input.arrangement,
  type: input.type,
  postedDaysAgo: existing?.postedDaysAgo ?? 0,
  source: input.source || "Added by the team",
  salary: input.salary ?? "",
  status: input.status,
  experience: input.experience ?? "",
  url: input.url,
  lastCheckedDaysAgo: 0,
  description: input.description ?? "",
  skills: (input.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
});

export const opportunitiesService = {
  list: async (role: Role): Promise<JobListing[]> =>
    communityStore.jobs.filter((job) => role === "admin" || job.status === "active"),

  detail: async (id: string): Promise<JobListing | null> =>
    communityStore.jobs.find((job) => job.id === id && job.status === "active") ?? null,

  /** Admin only. */
  scraper: async () => ({
    ...SCRAPER_STATUS,
    counts: {
      active: communityStore.jobs.filter((j) => j.status === "active").length,
      expired: communityStore.jobs.filter((j) => j.status === "expired").length,
      review: communityStore.jobs.filter((j) => j.status === "review").length,
    },
    inactive: communityStore.jobs.filter((j) => j.status !== "active"),
  }),

  // ── Admin: listings by hand until the feed is connected ──
  create: async (input: JobInput) => {
    const job = toListing(input, `job-${Date.now()}`);
    communityStore.jobs = [job, ...communityStore.jobs];
    logAdminAction({ actor: "Admin", action: "Added a job listing", object: `${job.title} · ${job.company}` });
    return job;
  },

  update: async ({ id, input }: { id: string; input: JobInput }) => {
    const existing = communityStore.jobs.find((j) => j.id === id);
    const job = toListing(input, id, existing);
    communityStore.jobs = communityStore.jobs.map((j) => (j.id === id ? job : j));
    logAdminAction({ actor: "Admin", action: "Edited a job listing", object: `${job.title} · ${job.company}` });
    return job;
  },

  remove: async (id: string) => {
    const job = communityStore.jobs.find((j) => j.id === id);
    communityStore.jobs = communityStore.jobs.filter((j) => j.id !== id);
    logAdminAction({ actor: "Admin", action: "Removed a job listing", object: job ? `${job.title} · ${job.company}` : id });
  },
};
