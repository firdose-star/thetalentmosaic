/**
 * Extraction (spec §6): one posting → structured role data.
 *
 * With ANTHROPIC_API_KEY set, Claude reads the posting and returns JSON that
 * matches `ExtractionSchema` (structured outputs, so the shape is guaranteed).
 * Without it — or if the call fails — simple rules fill what they can from
 * the source's own fields, and a warning tells the admin to check every field.
 * Either way the regex backstop then fills any contact detail still missing.
 *
 * `description` is 1–2 lines about the startup, not the job description —
 * members read the full posting at the source.
 */
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { getServerEnv } from "@/lib/config/env";
import { logger } from "@/lib/logger";
import {
  EMPLOYMENT_TYPES,
  INDUSTRIES,
  experienceBand,
  type ExperienceBand,
  type Industry,
  REMOTE_MODES,
  ROLE_FAMILIES,
  ROLE_SENIORITIES,
  type EmploymentType,
  type RemoteMode,
  type RoleContact,
  type RoleFamily,
  type RoleSeniority,
} from "@/types/roles";

import type { RawRecord } from "./collectors";
import { INDIA, isHrTitle } from "./gate";
import { employmentTypeFrom, experienceFrom, industryFrom } from "./classify";
import { companySummary, firstSentences } from "./summary";
import { compact, fillEmpty, findContacts, toE164 } from "./text";

const SYSTEM = `You extract structured job data for an HR community. Read ONE job posting or hiring post and return JSON matching the schema. Rules:
- Use only facts in the text. Never invent. Unknown → null / "unknown".
- Contact details: copy any email, WhatsApp/phone number, or LinkedIn profile URL that the poster gives for applicants. Normalise phone numbers to E.164 (assume +91 when 10 digits and the post is Indian). If the number is written in words or obfuscated ("nine eight seven…", "at gmail dot com"), decode it.
- contact.name / roleAtCompany: the person applicants are told to reach (often the poster). If the post says "DM me", set contact.other = "DM the poster" and use posterName.
- howToApply: quote the instruction (email subject, form link, "comment interested", etc.).
- salary: keep the text; convert to INR min/max only when the text states INR (or LPA → ×100000).
- isHrRole: true only when the job itself is in HR — HR, Talent Acquisition / recruiting, People & Culture, People Ops, HRBP, L&D, compensation & benefits, payroll, employer branding, or HR leadership. Sales, customer success, engineering, finance, marketing and operations roles are false, even when they mention HR words (a "Sales Compensation Analyst" or an "Engineer, HR Tech" is false).
- roleFamily: pick the closest; "other_hr" only if clearly HR but none fit.
- location: where the role is based. For remote roles, put any region restriction ("US only", "EMEA") in location.raw.
- companySummary: one or two plain sentences on what the company does, from the text only (its "About us" or similar). Not about the role. null if the text says nothing about the company.
- industry: what kind of company is hiring (D2C brand, FinTech, HealthTech…), from how the company describes itself — not from the HR duties. "other" when the text doesn't make it clear.
- experience: the years of experience asked for (minYears, maxYears; "5+ years" → 5 and null; interns/freshers → 0). null when not stated.
- employmentType: "unknown" unless the text says (full-time, part-time, contract, internship).
- confidence 0–1: how complete and unambiguous the posting is.`;

const text = z.string().nullable();

const ExtractionSchema = z.object({
  isHrRole: z.boolean(),
  title: z.string(),
  roleFamily: z.enum(ROLE_FAMILIES),
  seniority: z.enum(ROLE_SENIORITIES),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  company: z.object({ name: z.string(), url: text, stage: text, ycBatch: text }),
  location: z.object({ city: text, state: text, country: text, remoteMode: z.enum(REMOTE_MODES), raw: text }),
  salary: z.object({ text, minInr: z.number().nullable(), maxInr: z.number().nullable(), currency: text }),
  companySummary: text,
  industry: z.enum(INDUSTRIES),
  experience: z.object({ minYears: z.number().nullable(), maxYears: z.number().nullable(), text }),
  howToApply: text,
  contact: z.object({ name: text, roleAtCompany: text, email: text, whatsapp: text, phone: text, linkedinUrl: text, other: text }),
  confidence: z.number(),
  warnings: z.array(z.string()),
});

export interface ExtractedRole {
  isHrRole: boolean;
  title: string;
  roleFamily: RoleFamily;
  seniority: RoleSeniority;
  employmentType: EmploymentType;
  industry: Industry;
  experience: { minYears?: number; maxYears?: number; text?: string };
  experienceBand: ExperienceBand;
  company: { name: string; url?: string; stage?: string; ycBatch?: string; logoUrl?: string };
  location: { city?: string; state?: string; country?: string; remoteMode: RemoteMode; raw?: string };
  salary: { text?: string; minInr?: number; maxInr?: number; currency?: string };
  /** 1–2 lines on the startup. */
  description: string;
  howToApply?: string;
  contact: RoleContact;
  extraction: { model?: string; confidence: number; warnings: string[]; extractedAt: Date };
}

const ATS_BOARDS = new Set<RawRecord["source"]>(["greenhouse", "lever", "ashby"]);

/** Addresses in job-board boilerplate that aren't someone to apply to. */
const BOILERPLATE_EMAIL =
  /^(.*accommodat.*|.*accessib.*|.*privacy.*|.*no-?reply.*|donotreply|.*legal.*|.*security.*|.*disab.*|ada|.*compliance.*|gdpr|dpo|.*data-?protection.*|press|media|support|help|abuse|.*benefits.*|.*payroll.*|.*eeo.*)@/i;

const CITY_NAMES: [RegExp, string][] = [
  [/^(bangalore|bengaluru)( urban| rural)?$/i, "Bengaluru"],
  [/^(gurgaon|gurugram)$/i, "Gurugram"],
  [/^(bombay|mumbai)$/i, "Mumbai"],
  [/^(new delhi|delhi)$/i, "Delhi"],
  [/^(madras|chennai)$/i, "Chennai"],
  [/^(calcutta|kolkata)$/i, "Kolkata"],
  [/^(cochin|kochi)$/i, "Kochi"],
];

/** One spelling per city, so the Location filter doesn't list Bangalore and Bengaluru separately. */
export function normaliseCity(city?: string) {
  if (!city) return city;
  // "Bengaluru East", "Pune Division", "Mumbai Metropolitan Region", "Bangalore - DD" → the city.
  const trimmed = city
    .split(/ [-–] /)[0]
    .replace(/\s+(city|division|district|east|west|north|south|urban|rural|metropolitan region|area|region)$/i, "")
    .trim();
  return CITY_NAMES.find(([re]) => re.test(trimmed))?.[1] ?? trimmed;
}

let client: Anthropic | null = null;
function anthropic(apiKey: string) {
  client ??= new Anthropic({ apiKey });
  return client;
}

const userMessage = (r: RawRecord) =>
  `SOURCE: ${r.source}\nURL: ${r.url}\nPOSTER: ${r.posterName ?? "unknown"} (${r.posterUrl ?? "no profile link"})\nPOSTED: ${r.postedAt?.toISOString() ?? "unknown"}\n\n${r.rawText}`;

async function withClaude(record: RawRecord, apiKey: string, model: string): Promise<ExtractedRole> {
  const isSonnet55 = model.startsWith("claude-sonnet-5-5");
  const response = await anthropic(apiKey).beta.messages.parse({
    model,
    max_tokens: 1500,
    // Sonnet 5.5 rejects a non-default temperature; extraction runs with thinking
    // off instead, which keeps it fast and literal.
    ...(isSonnet55 ? { thinking: { type: "between_tools" as const } } : {}),
    // A declined request is re-run server-side on Anthropic's recommended model.
    ...(/^claude-(sonnet-5-5|opus-5|fable-5-1)/.test(model)
      ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
      : {}),
    system: SYSTEM,
    messages: [{ role: "user", content: userMessage(record) }],
    output_config: { format: betaZodOutputFormat(ExtractionSchema) },
  });
  if (response.stop_reason === "refusal") throw new Error("the model declined this posting");
  if (response.stop_reason === "max_tokens") throw new Error("the posting was too long to read in one pass");
  const out = response.parsed_output;
  if (!out) throw new Error("the model returned no usable JSON");

  return {
    isHrRole: out.isHrRole,
    title: out.title.trim() || record.title || "Untitled role",
    roleFamily: out.roleFamily,
    seniority: out.seniority,
    employmentType: out.employmentType,
    industry: out.industry,
    experience: compact(out.experience) as ExtractedRole["experience"],
    experienceBand: experienceBand(out.experience.minYears),
    company: compact({ ...out.company, name: out.company.name.trim() || record.companyName || "Company not stated" }) as ExtractedRole["company"],
    location: compact(out.location) as ExtractedRole["location"],
    salary: compact(out.salary) as ExtractedRole["salary"],
    description: out.companySummary ? firstSentences(out.companySummary) : (companySummary(record) ?? ""),
    howToApply: out.howToApply ?? undefined,
    contact: compact(out.contact) as RoleContact,
    extraction: { model: response.model, confidence: Math.max(0, Math.min(1, out.confidence)), warnings: out.warnings, extractedAt: new Date() },
  };
}

/* ── Rules: what we can read without a model ─────────────────────────────── */

function familyFromTitle(t: string): RoleFamily {
  if (/chro|chief people|head of (people|hr|human)|vp,? (people|hr)|people (head|director)/.test(t)) return "chro_head_of_people";
  if (/hrbp|business partner|people partner/.test(t)) return "hrbp";
  if (/recruit|talent acquisition|sourc|\bta\b|talent partner/.test(t)) return "talent_acquisition";
  if (/l&d|learning|training|enablement/.test(t)) return "l_and_d";
  if (/compensation|benefits|total rewards|payroll/.test(t)) return "comp_and_ben";
  if (/employer brand/.test(t)) return "employer_branding";
  if (/people (ops|operations)|hr ops|hr operations/.test(t)) return "people_ops";
  if (/generalist|hr (manager|executive|associate)|human resources/.test(t)) return "hr_generalist";
  return "other_hr";
}

function seniorityFromTitle(t: string): RoleSeniority {
  if (/intern\b|internship/.test(t)) return "intern";
  if (/\b(head|director|vp|vice president|chief|chro)\b/.test(t)) return "head";
  if (/\b(lead|principal|staff)\b/.test(t)) return "lead";
  if (/\b(senior|sr\.?)\b/.test(t)) return "senior";
  if (/\b(junior|jr\.?|associate|executive|coordinator)\b/.test(t)) return "junior";
  if (/\b(manager|specialist|partner)\b/.test(t)) return "mid";
  return "unknown";
}

function locationFrom(raw?: string, remote?: boolean): ExtractedRole["location"] {
  const r = (raw ?? "").toLowerCase();
  const remoteMode: RemoteMode = remote || /remote/.test(r) ? "remote" : /hybrid/.test(r) ? "hybrid" : raw ? "onsite" : "unknown";
  const parts = (raw ?? "").split(/[,;|/(]/).map((p) => p.replace(/remote|hybrid|on-?site|\)/gi, "").trim());
  const city = parts[0] || undefined;
  // "Gurugram, Haryana" and "Pune, Pimpri-Chinchwad Area" are India too; otherwise the last part.
  const country = INDIA.test(raw ?? "") ? "India" : parts.length > 1 ? parts[parts.length - 1] || undefined : undefined;
  return compact({ city, country, remoteMode, raw });
}

function withRules(record: RawRecord, reason: string): ExtractedRole {
  const title = (record.title ?? record.rawText.split("\n")[0] ?? "").slice(0, 200).trim() || "Untitled role";
  const t = title.toLowerCase();
  const meta = record.meta ?? {};
  return {
    // The title decides (see gate.ts) — or YC has filed it under Recruiting & HR.
    isHrRole: isHrTitle(title) || (record.source === "yc" && /^Category: Recruiting & HR/m.test(record.rawText)),
    title,
    roleFamily: familyFromTitle(t),
    seniority: seniorityFromTitle(t),
    employmentType: employmentTypeFrom({ commitment: meta.commitment, title, rawText: record.rawText }),
    industry: "other",
    experience: {},
    experienceBand: "other",
    company: compact({ name: record.companyName ?? "Company not stated", url: meta.companyUrl, ycBatch: meta.ycBatch, logoUrl: meta.logoUrl }),
    location: locationFrom(meta.location, meta.remote),
    salary: compact({ text: meta.salary }),
    description: companySummary(record) ?? "",
    contact: {},
    extraction: { confidence: 0.3, warnings: [`Read by simple rules, not Claude (${reason}) — check every field.`], extractedAt: new Date() },
  };
}

/** Read one posting. Never throws: a failed model call falls back to the rules. */
export async function extractRole(record: RawRecord): Promise<ExtractedRole> {
  const { ANTHROPIC_API_KEY, ROLES_EXTRACT_MODEL } = getServerEnv();
  let role: ExtractedRole;
  if (!ANTHROPIC_API_KEY) {
    role = withRules(record, "ANTHROPIC_API_KEY isn't set");
  } else {
    try {
      role = await withClaude(record, ANTHROPIC_API_KEY, ROLES_EXTRACT_MODEL);
    } catch (error) {
      logger.warn(`[extract] ${record.url}: ${error instanceof Error ? error.message : String(error)}`);
      role = withRules(record, error instanceof Anthropic.APIError ? `Claude API error ${error.status}` : "Claude couldn't read it");
    }
  }

  // Regex backstop — fills only what is still empty. Boilerplate addresses
  // (accessibility desks, privacy, no-reply) are never a contact. On ATS boards
  // phone numbers are office lines, so only emails are taken there.
  const found = findContacts(record.rawText);
  if (found.email && BOILERPLATE_EMAIL.test(found.email)) delete found.email;
  if (ATS_BOARDS.has(record.source)) {
    delete found.phone;
    delete found.whatsapp;
  }
  const contact = fillEmpty(role.contact, found);
  if (contact.email && BOILERPLATE_EMAIL.test(contact.email)) delete contact.email;
  if (contact.whatsapp) contact.whatsapp = toE164(contact.whatsapp) ?? contact.whatsapp;
  if (contact.phone) contact.phone = toE164(contact.phone) ?? contact.phone;
  if (contact.other === "DM the poster" && !contact.name && record.posterName) contact.name = record.posterName;
  if (record.meta) {
    role.company = fillEmpty(role.company, compact({ url: record.meta.companyUrl, ycBatch: record.meta.ycBatch, logoUrl: record.meta.logoUrl }));
    role.salary = fillEmpty(role.salary, compact({ text: record.meta.salary }));
  }
  role.location = compact({ ...role.location, city: normaliseCity(role.location.city) });

  // Company type, years and employment type: rules fill what the model (or the
  // rules above) couldn't tell; still unclear → "Other" in the filters.
  if (role.industry === "other") role.industry = industryFrom({ rawText: record.rawText, summary: role.description, companyName: role.company.name });
  if (role.experience.minYears === undefined) role.experience = experienceFrom({ rawText: record.rawText, title: role.title });
  role.experienceBand = experienceBand(role.experience.minYears);
  if (role.employmentType === "unknown") {
    role.employmentType = employmentTypeFrom({ commitment: record.meta?.commitment, title: role.title, rawText: record.rawText });
  }
  return { ...role, contact: compact(contact) };
}
