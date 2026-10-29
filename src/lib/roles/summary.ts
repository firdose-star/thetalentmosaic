/**
 * "1–2 lines on the startup" without a model: the source's own company
 * description when it has one (YC one-liner, LinkedIn About), else the
 * posting's "About us" paragraph, else the first paragraph that names the
 * company. Claude writes this itself when it is set up.
 */
import type { RawRecord } from "./collectors";
import { decodeEntities } from "./text";

const MAX = 280;

/** The first one or two sentences, cut at MAX characters. */
export function firstSentences(text: string, count = 2) {
  const sentences = decodeEntities(text).replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [];
  let out = "";
  for (const s of sentences.slice(0, count)) {
    if (out && (out + s).length > MAX) break;
    out += s;
  }
  out = out.trim();
  return out.length > MAX ? `${out.slice(0, MAX - 1).trimEnd()}…` : out;
}

const ABOUT_HEADING = /^(about (us|the company|the team|[\w .&'-]{2,40})|who we are|our (company|story|mission)|company overview)[:.]?$/i;
/** Paragraphs about the job, not the company. */
const JOB_PARAGRAPH = /^(about the (role|job|position|opportunity)|the role|role|responsibilities|requirements|what you|you will|you'll|we are looking|we're looking|location|job|key)/i;

export function companySummary(record: RawRecord): string | undefined {
  if (record.meta?.about) return firstSentences(record.meta.about);

  const paragraphs = record.rawText
    .split(/\n{2,}|\n(?=[A-Z][^\n]{0,60}\n)/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  // "About Okta" / "Who we are" — the paragraph after the heading.
  const heading = paragraphs.findIndex((p) => ABOUT_HEADING.test(p) && !JOB_PARAGRAPH.test(p));
  if (heading >= 0 && paragraphs[heading + 1]) return firstSentences(paragraphs[heading + 1]);

  // A paragraph that names the company and reads like prose — not one about the job
  // ("The Senior Total Rewards Manager supports…", "In this role…").
  const name = record.companyName?.split(/[\s(]/)[0];
  const title = record.title?.toLowerCase().split(/[,(–-]/)[0].trim();
  const aboutTheJob = (p: string) =>
    JOB_PARAGRAPH.test(p) || /^(as an? |in this role|this role|this position|the ideal candidate)/i.test(p) || (!!title && p.toLowerCase().includes(title));
  const named = paragraphs.slice(1, 12).find(
    (p) => p.length > 80 && /[.!?]/.test(p) && !aboutTheJob(p) && (!name || p.toLowerCase().includes(name.toLowerCase())),
  );
  return named ? firstSentences(named) : undefined;
}
