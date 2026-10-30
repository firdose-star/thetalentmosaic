/**
 * The Opportunities job feed: HR / People / Talent roles at startups, pulled
 * from public job boards or added by the team from a URL. Stored in MongoDB
 * (`roles`); this is the shape the API returns — dates as ISO strings.
 *
 * Members only ever see `approved` roles. `contact` is present only when the
 * caller may see it (signed in); `sources[].rawText` never leaves the server.
 */

export const ROLE_STATUSES = ["unverified", "approved", "hidden", "expired"] as const;
export type RoleStatus = (typeof ROLE_STATUSES)[number];

export const ROLE_FAMILIES = [
  "talent_acquisition",
  "hrbp",
  "people_ops",
  "l_and_d",
  "comp_and_ben",
  "hr_generalist",
  "employer_branding",
  "chro_head_of_people",
  "other_hr",
] as const;
export type RoleFamily = (typeof ROLE_FAMILIES)[number];

export const ROLE_FAMILY_LABELS: Record<RoleFamily, string> = {
  talent_acquisition: "Talent Acquisition",
  hrbp: "HR Business Partner",
  people_ops: "People Ops & Culture",
  l_and_d: "Learning & Development",
  comp_and_ben: "Compensation & Benefits",
  hr_generalist: "HR Generalist",
  employer_branding: "Employer Branding",
  chro_head_of_people: "CHRO / Head of People",
  other_hr: "Other HR",
};

export const ROLE_SENIORITIES = ["intern", "junior", "mid", "senior", "lead", "head", "unknown"] as const;
export type RoleSeniority = (typeof ROLE_SENIORITIES)[number];

export const ROLE_SENIORITY_LABELS: Record<RoleSeniority, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
  head: "Head",
  unknown: "Seniority not stated",
};

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship", "unknown"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  // The filter's "Other": the posting doesn't say.
  unknown: "Other",
};

/** What kind of company is hiring — "other" when the posting doesn't make it clear. */
export const INDUSTRIES = [
  "d2c",
  "ecommerce",
  "fintech",
  "healthtech",
  "edtech",
  "saas",
  "ai_deeptech",
  "foodtech",
  "mobility_logistics",
  "media_gaming",
  "climate_energy",
  "agritech",
  "proptech",
  "travel_hospitality",
  "manufacturing",
  "hr_services",
  "it_services",
  "other",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABELS: Record<Industry, string> = {
  d2c: "D2C / Consumer brands",
  ecommerce: "E-commerce / Marketplace",
  fintech: "FinTech",
  healthtech: "HealthTech",
  edtech: "EdTech",
  saas: "SaaS / B2B software",
  ai_deeptech: "AI / Deep tech",
  foodtech: "FoodTech",
  mobility_logistics: "Mobility / Logistics",
  media_gaming: "Media / Gaming",
  climate_energy: "Climate / Energy",
  agritech: "AgriTech",
  proptech: "Real estate / PropTech",
  travel_hospitality: "Travel / Hospitality",
  manufacturing: "Manufacturing / Industrial",
  hr_services: "HR services / Staffing",
  it_services: "IT services / Consulting",
  other: "Other",
};

/** Years of experience asked for, bucketed by the minimum — "other" when the posting doesn't say. */
export const EXPERIENCE_BANDS = ["0-2", "3-5", "6-10", "10+", "other"] as const;
export type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];

export const EXPERIENCE_BAND_LABELS: Record<ExperienceBand, string> = {
  "0-2": "0–2 years",
  "3-5": "3–5 years",
  "6-10": "6–10 years",
  "10+": "10+ years",
  other: "Other",
};

export function experienceBand(minYears?: number | null): ExperienceBand {
  if (minYears === undefined || minYears === null || Number.isNaN(minYears)) return "other";
  if (minYears <= 2) return "0-2";
  if (minYears <= 5) return "3-5";
  if (minYears <= 9) return "6-10";
  return "10+";
}

/** "3–5 years", "5+ years" — for cards. */
export function experienceText(e?: { minYears?: number; maxYears?: number }) {
  if (e?.minYears === undefined) return null;
  if (e.maxYears !== undefined && e.maxYears > e.minYears) return `${e.minYears}–${e.maxYears} years`;
  return e.minYears === 0 ? "Freshers welcome" : `${e.minYears}+ years`;
}

export const REMOTE_MODES = ["onsite", "hybrid", "remote", "unknown"] as const;
export type RemoteMode = (typeof REMOTE_MODES)[number];

export const REMOTE_MODE_LABELS: Record<RemoteMode, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
  unknown: "Work mode not stated",
};

export const ROLE_SOURCES = ["greenhouse", "lever", "ashby", "yc", "hn", "linkedin", "manual_url", "manual"] as const;
export type RoleSourceKind = (typeof ROLE_SOURCES)[number];

export const ROLE_SOURCE_LABELS: Record<RoleSourceKind, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  yc: "YC",
  hn: "HN",
  linkedin: "LinkedIn",
  manual_url: "LinkedIn post",
  manual: "Added by team",
};

/** Collectors that poll on a schedule (everything but the team's own additions). */
export const COLLECTOR_KINDS = ["greenhouse", "lever", "ashby", "yc", "hn", "linkedin"] as const;
export type CollectorKind = (typeof COLLECTOR_KINDS)[number];

export interface RoleContact {
  name?: string;
  roleAtCompany?: string;
  email?: string;
  /** E.164, e.g. +919876543210. */
  whatsapp?: string;
  phone?: string;
  linkedinUrl?: string;
  other?: string;
}

export interface RoleSource {
  source: RoleSourceKind;
  /** Where "Apply at source" sends the member. */
  url: string;
  posterName?: string;
  posterUrl?: string;
  postedAt?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface RoleListing {
  id: string;
  status: RoleStatus;
  title: string;
  roleFamily: RoleFamily;
  seniority: RoleSeniority;
  employmentType: EmploymentType;
  /** Absent on roles collected before this field existed — read as "other". */
  industry?: Industry;
  experience?: { minYears?: number; maxYears?: number; text?: string };
  experienceBand?: ExperienceBand;
  company: { name: string; url?: string; stage?: string; ycBatch?: string; logoUrl?: string };
  location: { city?: string; state?: string; country?: string; remoteMode: RemoteMode; raw?: string };
  salary: { text?: string; minInr?: number; maxInr?: number; currency?: string };
  /** 1–2 lines on the startup — not the job description, which stays at the source. */
  description: string;
  howToApply?: string;
  /** Only when the caller may see contact details. */
  contact?: RoleContact;
  /** The first is the primary source. */
  sources: RoleSource[];
  /** Admin responses only. */
  extraction?: { model?: string; confidence?: number; warnings?: string[]; extractedAt?: string };
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  expiresAt?: string;
}

export interface IngestSource {
  id: string;
  kind: CollectorKind;
  slug?: string;
  companyName?: string;
  enabled: boolean;
  lastRunAt?: string;
  lastStatus?: string;
}

export interface IngestRun {
  id: string;
  source: CollectorKind;
  startedAt: string;
  finishedAt?: string;
  fetched: number;
  matched: number;
  inserted: number;
  updated: number;
  errors: string[];
}
