/**
 * Job board filtering and sorting: Role, Location, Employment Type and Sort.
 * Pure functions so the API can adopt the same semantics server-side.
 */
import { SENIORITY_LEVELS, type JobListing } from "@/types/community";

export const JOB_FILTER_KEYS = ["role", "location", "type", "sort"] as const;
export type JobFilterKey = (typeof JOB_FILTER_KEYS)[number];
export type JobFilters = Record<JobFilterKey, string>;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "company", label: "Company A–Z" },
  { value: "seniority", label: "Most senior first" },
];

const rank = (s: JobListing["seniority"]) => SENIORITY_LEVELS.indexOf(s);

export function filterJobs(jobs: JobListing[], f: JobFilters) {
  const filtered = jobs.filter(
    (j) =>
      (!f.role || j.hrFunction === f.role) &&
      (!f.location || j.location === f.location) &&
      (!f.type || j.type === f.type),
  );

  const age = (j: JobListing) => j.postedDaysAgo ?? Number.MAX_SAFE_INTEGER;
  switch (f.sort) {
    case "oldest":
      return filtered.sort((a, b) => (b.postedDaysAgo ?? -1) - (a.postedDaysAgo ?? -1));
    case "company":
      return filtered.sort((a, b) => a.company.localeCompare(b.company));
    case "seniority":
      return filtered.sort((a, b) => rank(b.seniority) - rank(a.seniority));
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
