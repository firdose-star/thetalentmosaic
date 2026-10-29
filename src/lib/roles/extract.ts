/**
 * Extraction (spec §6): one posting → structured role data.
 *
 * With ANTHROPIC_API_KEY set, Claude reads the posting and returns JSON that
 * matches `ExtractionSchema` (structured outputs, so the shape is guaranteed).
 * Without it — or if the call fails — simple rules fill what they can from
 * the source's own fields, and a warning tells the admin to check every field.
 * Either way the regex backstop then fills any contact detail still missing.
 */
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { getServerEnv } from "@/lib/config/env";
import { logger } from "@/lib/logger";
import {
  EMPLOYMENT_TYPES,
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
import { HR_GATE } from "./gate";
import { compact, fillEmpty, findContacts, toE164 } from "./text";

const SYSTEM = `You extract structured job data for an HR community. Read ONE job posting or hiring post and return JSON matching the schema. Rules:
- Use only facts in the text. Never invent. Unknown → null / "unknown".
- Contact details: copy any email, WhatsApp/phone number, or LinkedIn profile URL that the poster gives for applicants. Normalise phone numbers to E.164 (assume +91 when 10 digits and the post is Indian). If the number is written in words or obfuscated ("nine eight seven…", "at gmail dot com"), decode it.
- contact.name / roleAtCompany: the person applicants are told to reach (often the poster). If the post says "DM me", set contact.other = "DM the poster" and use posterName.
- howToApply: quote the instruction (email subject, form link, "comment interested", etc.).
- salary: keep the text; convert to INR min/max only when the text states INR (or LPA → ×100000).
- roleFamily: pick the closest; "other_hr" only if clearly HR but none fit. If the posting is NOT an HR/People/Talent role, set isHrRole=false.
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
  description: z.string(),
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
  company: { name: string; url?: string; stage?: string; ycBatch?: string; logoUrl?: string };
  location: { city?: string; state?: string; country?: string; remoteMode: RemoteMode; raw?: string };
  salary: { text?: string; minInr?: number; maxInr?: number; currency?: string };
  description: string;
  howToApply?: string;
  contact: RoleContact;
  extraction: { model?: string; confidence: number; warnings: string[]; extractedAt: Date };
}

const ATS_BOARDS = new Set<RawRecord["source"]>(["greenhouse", "lever", "ashby"]);

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
    // The JSON carries the full description back, so 1500 tokens truncates long JDs.
    max_tokens: 4096,
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
    company: compact({ ...out.company, name: out.company.name.trim() || record.companyName || "Company not stated" }) as ExtractedRole["company"],
    location: compact(out.location) as ExtractedRole["location"],
    salary: compact(out.salary) as ExtractedRole["salary"],
    description: out.description.trim() || record.rawText,
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

function typeFrom(t: string): EmploymentType {
  if (/intern/.test(t)) return "internship";
  if (/contract|freelance|consultant/.test(t)) return "contract";
  if (/part[- ]time/.test(t)) return "part_time";
  if (/full[- ]time|permanent/.test(t)) return "full_time";
  return "unknown";
}

function locationFrom(raw?: string, remote?: boolean): ExtractedRole["location"] {
  const r = (raw ?? "").toLowerCase();
  const remoteMode: RemoteMode = remote || /remote/.test(r) ? "remote" : /hybrid/.test(r) ? "hybrid" : raw ? "onsite" : "unknown";
  const parts = (raw ?? "").split(/[,;|/(]/).map((p) => p.replace(/remote|hybrid|on-?site|\)/gi, "").trim());
  const city = parts[0] || undefined;
  const country = parts.length > 1 ? parts[parts.length - 1] || undefined : undefined;
  return compact({ city, country, remoteMode, raw });
}

function withRules(record: RawRecord, reason: string): ExtractedRole {
  const title = (record.title ?? record.rawText.split("\n")[0] ?? "").slice(0, 200).trim() || "Untitled role";
  const t = title.toLowerCase();
  const meta = record.meta ?? {};
  return {
    // The title has to say so — or YC has filed it under Recruiting & HR.
    isHrRole: HR_GATE.test(title) || (record.source === "yc" && /^Category: Recruiting & HR/m.test(record.rawText)),
    title,
    roleFamily: familyFromTitle(t),
    seniority: seniorityFromTitle(t),
    employmentType: typeFrom(`${meta.commitment ?? ""} ${t}`.toLowerCase()),
    company: compact({ name: record.companyName ?? "Company not stated", url: meta.companyUrl, ycBatch: meta.ycBatch, logoUrl: meta.logoUrl }),
    location: locationFrom(meta.location, meta.remote),
    salary: compact({ text: meta.salary }),
    description: record.rawText,
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

  // Regex backstop — fills only what is still empty. Not on ATS boards: there the
  // way to apply is the board itself, and the only emails and numbers in the text
  // are boilerplate (accessibility desks, office lines), not someone to contact.
  const contact = ATS_BOARDS.has(record.source) ? role.contact : fillEmpty(role.contact, findContacts(record.rawText));
  if (contact.whatsapp) contact.whatsapp = toE164(contact.whatsapp) ?? contact.whatsapp;
  if (contact.phone) contact.phone = toE164(contact.phone) ?? contact.phone;
  if (contact.other === "DM the poster" && !contact.name && record.posterName) contact.name = record.posterName;
  if (record.meta) {
    role.company = fillEmpty(role.company, compact({ url: record.meta.companyUrl, ycBatch: record.meta.ycBatch, logoUrl: record.meta.logoUrl }));
    role.salary = fillEmpty(role.salary, compact({ text: record.meta.salary }));
  }
  return { ...role, contact: compact(contact) };
}
