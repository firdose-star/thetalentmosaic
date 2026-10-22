/**
 * Job board filtering and sorting (spec §8.4), as pure functions so the API
 * can adopt the same semantics server-side.
 */
import type { JobListing } from "@/types/community";

export const JOB_FILTER_KEYS = [
  "q",
  "location",
  "arrangement",
  "function",
  "seniority",
  "company",
  "type",
  "posted",
  "source",
  "salary",
  "sort",
] as const;
export type JobFilterKey = (typeof JOB_FILTER_KEYS)[number];
export type JobFilters = Record<JobFilterKey, string>;

export const POSTED_OPTIONS = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export const SALARY_OPTIONS = [{ value: "disclosed", label: "Salary disclosed" }];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "company", label: "Company A–Z" },
  { value: "seniority", label: "Most senior first" },
];

const SENIORITY_RANK = { Associate: 0, Manager: 1, Head: 2, "Director/VP": 3, CHRO: 4 };

export function filterJobs(jobs: JobListing[], f: JobFilters) {
  const q = f.q.trim().toLowerCase();
  const maxDays = f.posted ? Number(f.posted) : null;

  const filtered = jobs.filter(
    (j) =>
      (!q || `${j.title} ${j.company} ${j.hrFunction} ${j.location}`.toLowerCase().includes(q)) &&
      (!f.location || j.location === f.location) &&
      (!f.arrangement || j.arrangement === f.arrangement) &&
      (!f.function || j.hrFunction === f.function) &&
      (!f.seniority || j.seniority === f.seniority) &&
      (!f.company || j.company === f.company) &&
      (!f.type || j.type === f.type) &&
      (maxDays === null || (j.postedDaysAgo !== null && j.postedDaysAgo <= maxDays)) &&
      (!f.source || j.source === f.source) &&
      (!f.salary || Boolean(j.salary)),
  );

  const age = (j: JobListing) => j.postedDaysAgo ?? Number.MAX_SAFE_INTEGER;
  switch (f.sort) {
    case "oldest":
      return filtered.sort((a, b) => (b.postedDaysAgo ?? -1) - (a.postedDaysAgo ?? -1));
    case "company":
      return filtered.sort((a, b) => a.company.localeCompare(b.company));
    case "seniority":
      return filtered.sort((a, b) => SENIORITY_RANK[b.seniority] - SENIORITY_RANK[a.seniority]);
    default:
      return filtered.sort((a, b) => age(a) - age(b));
  }
}

export function postedText(days: number | null) {
  if (days === null) return "Posting date not available";
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

export function checkedText(days: number) {
  if (days === 0) return "Checked today";
  if (days === 1) return "Checked yesterday";
  return `Checked ${days} days ago`;
}
