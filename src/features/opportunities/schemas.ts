import { z } from "zod";

import {
  EMPLOYMENT_TYPES,
  REMOTE_MODES,
  ROLE_FAMILIES,
  ROLE_SENIORITIES,
  ROLE_STATUSES,
} from "@/types/roles";

const optional = (max = 2000) => z.string().trim().max(max).optional();
const optionalUrl = z.union([z.literal(""), z.url("A link starting with https://")]).optional();

/** Admin: a role added by hand, or edited after collection. Validated in the browser and again by the API. */
export const roleInputSchema = z.object({
  title: z.string().trim().min(2, "Job title").max(200),
  company: z.string().trim().min(1, "Company").max(200),
  companyUrl: optionalUrl,
  roleFamily: z.enum(ROLE_FAMILIES),
  seniority: z.enum(ROLE_SENIORITIES),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  city: optional(100),
  country: optional(100),
  remoteMode: z.enum(REMOTE_MODES),
  salaryText: optional(200),
  /** 1–2 lines on the startup. */
  description: z.string().trim().max(400, "Keep it to a line or two"),
  howToApply: optional(),
  applyUrl: z.url("The original link, starting with https://"),
  contactName: optional(200),
  contactRole: optional(200),
  contactEmail: z.union([z.literal(""), z.email("An email address")]).optional(),
  contactWhatsapp: optional(40),
  contactPhone: optional(40),
  contactLinkedin: optionalUrl,
  contactOther: optional(500),
  status: z.enum(ROLE_STATUSES),
});
export type RoleInput = z.infer<typeof roleInputSchema>;

/** PATCH: any subset — "Approve" sends only `{ status }`. */
export const rolePatchSchema = roleInputSchema.partial();
export type RolePatch = z.infer<typeof rolePatchSchema>;

/** Admin: "Add from URL". */
export const ingestUrlSchema = z.object({
  url: z.url("The post or job link, starting with https://"),
  pastedText: z.string().trim().max(30_000).optional(),
});
export type IngestUrlInput = z.infer<typeof ingestUrlSchema>;

/** Admin: another company board (or LinkedIn search) for the feed to poll. */
export const ingestSourceSchema = z.object({
  kind: z.enum(["greenhouse", "lever", "ashby", "linkedin"]),
  // A board slug, or for LinkedIn the search keywords.
  slug: z.string().trim().min(1, "The board's slug, or LinkedIn search words").max(100).regex(/^[A-Za-z0-9_.& -]+$/, "Letters, numbers, spaces, & - and _ only"),
  companyName: z.string().trim().max(200).optional(),
});
export type IngestSourceInput = z.infer<typeof ingestSourceSchema>;
