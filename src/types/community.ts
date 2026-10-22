/**
 * Community domain models (PRD §9). Shared across feature slices — the People
 * directory, Overview, Events and Health all read the same `Member`.
 *
 * Dates are ISO `YYYY-MM-DD` strings unless a field says otherwise, so they
 * serialise unchanged between MongoDB, the API, and the browser.
 */

export const SENIORITY_LEVELS = [
  "Associate",
  "Manager",
  "Head",
  "Director/VP",
  "CHRO",
] as const;
export type Seniority = (typeof SENIORITY_LEVELS)[number];

export const HR_FUNCTIONS = [
  "Talent Acquisition",
  "HR Business Partnering",
  "Learning & Development",
  "Compensation & Benefits",
  "People Operations",
  "People Analytics",
  "Culture & Engagement",
  "Generalist HR",
] as const;
export type HrFunction = (typeof HR_FUNCTIONS)[number];

export const EXPERIENCE_BANDS = [
  "0–5 years",
  "6–10 years",
  "11–15 years",
  "16+ years",
] as const;
export type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];

export function experienceBand(years: number): ExperienceBand {
  if (years <= 5) return "0–5 years";
  if (years <= 10) return "6–10 years";
  if (years <= 15) return "11–15 years";
  return "16+ years";
}

export type MemberStatus = "Active" | "On break" | "Inactive";
export const MEMBER_STATUSES: MemberStatus[] = ["Active", "On break", "Inactive"];

export interface Member {
  id: string;
  name: string;
  designation: string;
  startup: string;
  city: string;
  seniority: Seniority;
  hrFunction: HrFunction;
  yearsOfExperience: number;
  interests: string[];
  hobbies: string[];
  /** Empty when the member has not shared it. */
  linkedin: string;
  email: string;
  whatsapp: string;
  /** Approval date — "Member since" derives from this. */
  joinedOn: string;
  birthday: { month: number; day: number };
  status: MemberStatus;
  tags: string[];
  /** Ids of past events the member attended. */
  eventsAttended: string[];
  /** Relationship owner (admin name), or null when unassigned. */
  owner: string | null;
  /** ISO datetime of last login, or null if never logged in. */
  lastLoginAt: string | null;
  /** Successful logins since joining — "returned multiple times" (PRD §8). */
  loginCount: number;
}

export type EventFormat = "In person" | "Online" | "Hybrid";

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  /** Display time, e.g. "6:30 PM". Past events may omit it. */
  time?: string;
  format: EventFormat;
  /** City only — what members see. */
  city: string;
  /** Full venue — admins only (PRD §3). */
  venue?: string;
  category: string;
  description: string;
  registered?: number;
  capacity?: number;
  attended?: number;
  photos?: number;
  /** Member id when member-hosted; omitted when hosted by The Talent Mosaic. */
  hostedById?: string;
  /** Resolved host name (filled by the service from `hostedById`). */
  hostedBy?: string;
  registrationUrl?: string;
  cost?: string;
  winners?: { prize: string; winner: string }[];
  /** Member ids an admin tagged as co-hosts. */
  coHostIds?: string[];
}

export type JobStatus = "active" | "expired" | "review";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  hrFunction: HrFunction;
  seniority: Seniority;
  arrangement: "Hybrid" | "On-site" | "Remote";
  type: "Full-time" | "Contract" | "Internship";
  /** Days since posting; null when the source gave no date. */
  postedDaysAgo: number | null;
  source: string;
  salary: string;
  status: JobStatus;
  experience: string;
  /** Original application link at the source. */
  url: string;
  /** Days since the scraper last confirmed the listing is live. */
  lastCheckedDaysAgo: number;
  description: string;
  skills: string[];
}
