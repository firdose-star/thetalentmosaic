/**
 * Text helpers for the job feed: HTML → plain text, the dedupe key, and the
 * regex backstop that finds contact details the model left out.
 */
import { createHash } from "node:crypto";

import type { RoleContact } from "@/types/roles";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", "#x27": "'", "#x2F": "/" };

export function decodeEntities(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+|#x?[0-9a-f]+);/gi, (m, name) => ENTITIES[name] ?? m);
}

/** HTML (or entity-escaped HTML, as Greenhouse sends it) → readable plain text. */
export function htmlToText(html: string) {
  let s = html;
  // Greenhouse double-encodes: `&lt;p&gt;` — decode once so the tags are real.
  if (/&lt;\/?[a-z]/i.test(s)) s = decodeEntities(s);
  s = s
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      return href.startsWith("http") && !text.includes(href) ? `${text} (${href})` : text;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr)>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(s)
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(pvt|private|ltd|limited|inc|llc|technologies|labs)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** One role, wherever it was seen: company + title + city (or work mode). */
export function dedupeKey(company: string, title: string, cityOrMode: string) {
  return createHash("sha1").update(`${normalise(company)}|${normalise(title)}|${normalise(cityOrMode)}`).digest("hex");
}

/** A phone number → E.164. Ten digits starting 6–9 are taken as Indian (+91). */
export function toE164(raw: string): string | undefined {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  const bare = digits.replace(/^\+/, "");
  if (/^[6-9]\d{9}$/.test(bare)) return `+91${bare}`;
  if (/^91[6-9]\d{9}$/.test(bare)) return `+${bare}`;
  if (/^0[6-9]\d{9}$/.test(bare)) return `+91${bare.slice(1)}`;
  return undefined;
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
// Bounded, so digits inside IDs, URLs and longer numbers don't read as a phone number.
const INDIAN_PHONE = /(?<![\w/=.+-])(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/;
const INTL_PHONE = /(?<![\w/=.])\+\d{8,15}(?!\d)/;
const WHATSAPP = /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d+)/i;
const LINKEDIN = /linkedin\.com\/in\/[\w-]+/i;

/**
 * Contact details found by pattern alone. Runs after the model and only fills
 * fields it left empty. A plain phone number in a post is usually WhatsApp in
 * India, so it fills both.
 */
export function findContacts(text: string): RoleContact {
  const found: RoleContact = {};
  const email = text.match(EMAIL)?.[0].replace(/[.,;:]+$/, "");
  if (email) found.email = email;
  const wa = text.match(WHATSAPP)?.[1];
  if (wa) found.whatsapp = toE164(wa.startsWith("91") || wa.length > 10 ? `+${wa}` : wa);
  const phone = text.match(INDIAN_PHONE)?.[0] ?? text.match(INTL_PHONE)?.[0];
  const e164 = phone ? toE164(phone) : undefined;
  if (e164) {
    found.phone = e164;
    found.whatsapp ??= e164;
  }
  const linkedin = text.match(LINKEDIN)?.[0];
  if (linkedin) found.linkedinUrl = `https://www.${linkedin.replace(/^www\./, "")}`;
  return found;
}

/** Fill the empty fields of `base` from `extra`. */
export function fillEmpty<T extends object>(base: T, extra: Partial<T>): T {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra) as [keyof T, T[keyof T]][]) {
    if (value !== undefined && value !== null && value !== "" && (out[key] === undefined || out[key] === null || out[key] === "")) out[key] = value;
  }
  return out;
}

/** Drop null / empty-string fields so documents stay small and "empty" means absent. */
export function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== "")) as T;
}
