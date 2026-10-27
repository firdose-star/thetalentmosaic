/**
 * Community Form → member records.
 *
 * Turns the Google Form export into clean `Member` records plus a report of
 * everything that needed fixing. Pure functions — no file access — so the
 * same code can later run inside the MongoDB import job.
 *
 * Column decisions (agreed with the community team):
 *   Timestamp            → joining date ("Mosaic Member since", live)
 *   Full Name            → name (tidied)
 *   Company              → startup
 *   Current Role         → designation (HR function inferred from it)
 *   Seniority            → seniority, as the form asks it
 *   Email ID             → email (admin only)
 *   LinkedIn Profile     → LinkedIn (normalised; non-URLs dropped)
 *   City of Residence    → city (standardised)
 *   Birthday             → month and day (impossible dates dropped)
 *   Hobbies              → hobby keywords
 *   Upload a pic         → photo (Google Drive)
 *   Directory consent    → kept so the directory can honour it
 *   Email Address        → second email (admin only)
 *   Whatsapp No.         → WhatsApp (admin only, validated)
 *   Total YoE in HR?     → years of experience
 *   Events Attended      → events attended (admin-editable)
 *   Added to Community   → kept for admins
 *   Contribution, Suggestions, Column 17, Comment, Notion → not imported
 */
import type { CommunityEvent, HrFunction, Member, Seniority } from "@/types/community";
import { SENIORITY_LEVELS } from "@/types/community";

// ── CSV ─────────────────────────────────────────────────────────────────────

/** RFC 4180-style parser: quoted fields may contain commas, quotes and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

// ── Field cleaners ──────────────────────────────────────────────────────────

const clean = (v: string | undefined) => (v ?? "").replace(/\s+/g, " ").trim();
const isBlank = (v: string) => !v || /^(na|n\/a|nil|nik|none|nothing|-|\.)$/i.test(v);

/** "mohammed mubarak" → "Mohammed Mubarak"; leaves "CR Bagath" alone. */
export function tidyName(raw: string) {
  return clean(raw)
    .split(" ")
    .map((w) => (w && w === w.toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** "12/9/2025 15:48:48" (India time) → ISO timestamp. */
export function parseTimestamp(raw: string): string | null {
  const m = clean(raw).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, mo, d, y, h, mi, s = "0"] = m;
  const pad = (n: string) => n.padStart(2, "0");
  return new Date(`${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${mi}:${pad(s)}+05:30`).toISOString();
}

/** Month and day, or null when missing or clearly not a birthday. */
export function parseBirthday(raw: string, now = new Date()) {
  const m = clean(raw).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [month, day, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  // Years like 1111 or 2026 are placeholders or the date the form was filled.
  if (year < 1940 || year > now.getFullYear() - 15) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month: month - 1, day };
}

const EMAIL = /[^\s@,&;]+@[^\s@,&;]+\.[^\s@,&;]+/;
export function parseEmail(raw: string) {
  return (clean(raw).match(EMAIL)?.[0] ?? "").toLowerCase();
}

/** "https://www.linkedin.com/in/x?utm…" → "linkedin.com/in/x"; anything else → "". */
export function parseLinkedin(raw: string) {
  const m =
    clean(raw).match(/linkedin\.com\/in\/([^/?#\s]+)/i) ??
    // "linkedin.com/ishamakhijani-1" — the /in/ was dropped, but the handle is there.
    clean(raw).match(/linkedin\.com\/(?!feed\b|in\b|company\b)([\w-]{3,})\/?$/i);
  return m ? `linkedin.com/in/${decodeURIComponent(m[1]).replace(/\/$/, "")}` : "";
}

/** Indian mobile → 10 digits, or "" when it isn't one. */
export function parseWhatsapp(raw: string) {
  let digits = clean(raw).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : "";
}

const CITY_ALIASES: Record<string, string> = {
  bengaluru: "Bangalore",
  bangalore: "Bangalore",
  gurugram: "Gurgaon",
  gurgaon: "Gurgaon",
  "new delhi": "Delhi",
  bombay: "Mumbai",
};

/** "Bengaluru/ Delhi" → "Bangalore"; "Noida (to be specific)" → "Noida"; "Vellore, TN" → "Vellore". */
export function parseCity(raw: string) {
  const first = clean(raw).split(/[/,(]/)[0].trim();
  if (!first) return "Not shared";
  const key = first.toLowerCase();
  return CITY_ALIASES[key] ?? first.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseSeniority(raw: string): Seniority {
  const v = clean(raw);
  return (SENIORITY_LEVELS as readonly string[]).includes(v) ? (v as Seniority) : "Other";
}

/** HR function isn't on the form, so infer it from the job title. */
export function inferHrFunction(role: string): HrFunction {
  const r = role.toLowerCase();
  if (/talent acq|recruit|\bta\b|hiring|sourc|campus/.test(r)) return "Talent Acquisition";
  if (/hrbp|business partner|people success|people & culture partner|business hr/.test(r)) return "HR Business Partnering";
  if (/l&d|learning|talent management|training/.test(r)) return "Learning & Development";
  if (/comp|benefit|reward|payroll/.test(r)) return "Compensation & Benefits";
  if (/analytic|strategy/.test(r)) return "People Analytics";
  if (/culture|engagement|branding|communication/.test(r)) return "Culture & Engagement";
  if (/operation|ops\b|admin/.test(r)) return "People Operations";
  return "Generalist HR";
}

/** Google Drive "open?id=…" → a thumbnail URL an <img> can show. */
export function parsePhoto(raw: string) {
  const id = clean(raw).match(/[?&]id=([\w-]+)/)?.[1] ?? clean(raw).match(/\/d\/([\w-]+)/)?.[1];
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : null;
}

export function parseYears(raw: string) {
  const n = Number.parseFloat(clean(raw));
  return Number.isFinite(n) && n >= 0 && n < 60 ? n : null;
}

/** Free-text hobbies → keywords, so People can filter by hobby. */
const HOBBY_KEYWORDS: [string, RegExp][] = [
  ["Reading", /read|book|literature|non-fiction|fiction|sci-fi/],
  ["Writing", /writ|blog|ghostwrit|journal/],
  ["Poetry", /poet|poem/],
  ["Music", /music|song|jam|concert|dj\b|harmonium|hindustani/],
  ["Singing", /sing|karaoke/],
  ["Dancing", /danc|bhangra/],
  ["Cooking", /cook|recipe|bak/],
  ["Food & cafés", /food|cafe|café|cuisine|foodie|coffee/],
  ["Travel", /travel|trip|explor|sightsee|road trip|long drive|places/],
  ["Trekking & hiking", /trek|hik|mountain|nature/],
  ["Running", /run|marathon/],
  ["Cycling & biking", /cycl|bik|riding/],
  ["Fitness", /gym|work ?out|fitness|pilates|athlet/],
  ["Yoga", /yoga/],
  ["Swimming", /swim/],
  ["Badminton", /badminton/],
  ["Cricket", /cricket/],
  ["Football", /football|barca/],
  ["Basketball", /basketball/],
  ["Sports", /sport|volleyball|table tennis|squash|snooker|pickleball|paddle|tug of war|outdoor game|indoor game/],
  ["Painting & art", /paint|art\b|arts|artistic|artwork|sketch|draw|doodl|gallery|museum/],
  ["Crafts", /craft|crochet|macrame|pottery|carving|diy|fashion design/],
  ["Photography", /photograph/],
  ["Movies & shows", /movie|film|web series|show|documentar|ott|binge/],
  ["Gaming", /gaming|video game|online gaming|games night/],
  ["Board games", /board game|puzzl|mind game|quiz/],
  ["Theatre & speaking", /theatre|theater|acting|public speaking|open mic|debat|podcast/],
  ["Networking", /network|meeting (new )?people|connect|conversation|people/],
  ["Gardening", /garden/],
  ["Pets", /\bdog\b|\bpets?\b/],
];

export function hobbyKeywords(raw: string) {
  const text = clean(raw).toLowerCase();
  if (isBlank(text)) return [];
  return HOBBY_KEYWORDS.filter(([, re]) => re.test(text)).map(([label]) => label);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function stableId(email: string, name: string) {
  let h = 5381;
  for (const c of email || name) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return `cf-${slug(name).slice(0, 24)}-${h.toString(36)}`;
}

// ── Import ──────────────────────────────────────────────────────────────────

export interface ImportReport {
  fileRows: number;
  imported: number;
  /** People who submitted the form more than once — merged into one record. */
  merged: { name: string; submissions: number }[];
  invalid: {
    birthday: string[];
    linkedin: string[];
    whatsapp: string[];
    timestamp: string[];
  };
  missingWhatsapp: number;
  missingYoe: number;
  directoryConsentNo: string[];
  addedToCommunity: Record<string, number>;
  events: string[];
}

export interface CommunityImport {
  importedAt: string;
  members: Member[];
  events: CommunityEvent[];
  report: ImportReport;
}

/** Column lookup by header text, so a reordered sheet still imports. */
function columns(header: string[]) {
  const find = (...needles: string[]) =>
    header.findIndex((h) => needles.some((n) => h.toLowerCase().includes(n.toLowerCase())));
  return {
    timestamp: find("timestamp"),
    name: find("full name"),
    company: find("company"),
    role: find("current role"),
    seniority: find("seniority"),
    email: find("email id"),
    linkedin: find("linkedin"),
    city: find("city"),
    birthday: find("birthday"),
    hobbies: find("hobbies"),
    photo: find("upload a pic", "pic"),
    consent: find("member directory"),
    formEmail: header.findIndex((h) => h.trim().toLowerCase() === "email address"),
    whatsapp: find("whatsapp"),
    yoe: find("yoe"),
    events: find("events attended"),
    added: find("added to community"),
  };
}

export function importCommunityForm(csv: string, now = new Date()): CommunityImport {
  const [header = [], ...body] = parseCsv(csv);
  const col = columns(header);
  const cell = (row: string[], i: number) => (i >= 0 ? clean(row[i]) : "");

  const report: ImportReport = {
    fileRows: body.length,
    imported: 0,
    merged: [],
    invalid: { birthday: [], linkedin: [], whatsapp: [], timestamp: [] },
    missingWhatsapp: 0,
    missingYoe: 0,
    directoryConsentNo: [],
    addedToCommunity: {},
    events: [],
  };

  const eventIds = new Map<string, string>();
  const byKey = new Map<string, { member: Member; submissions: number }>();

  for (const row of body) {
    const name = tidyName(cell(row, col.name));
    if (!name) continue;
    const email = parseEmail(cell(row, col.email));
    const joinedAt = parseTimestamp(cell(row, col.timestamp));
    if (!joinedAt) report.invalid.timestamp.push(name);

    const rawLinkedin = cell(row, col.linkedin);
    const linkedin = parseLinkedin(rawLinkedin);
    if (rawLinkedin && !linkedin) report.invalid.linkedin.push(name);

    const rawBirthday = cell(row, col.birthday);
    const birthday = parseBirthday(rawBirthday, now);
    if (rawBirthday && !birthday) report.invalid.birthday.push(name);

    const rawWhatsapp = cell(row, col.whatsapp);
    const whatsapp = parseWhatsapp(rawWhatsapp);
    if (rawWhatsapp && !whatsapp) report.invalid.whatsapp.push(name);

    const designation = cell(row, col.role) || "HR professional";
    const events = cell(row, col.events)
      .split(/[,;]/)
      .map(clean)
      .filter((e) => e && !/^(tbc|na|n\/a|-)$/i.test(e))
      .map((title) => {
        if (!eventIds.has(title)) eventIds.set(title, `cf-ev-${slug(title)}`);
        return eventIds.get(title)!;
      });

    const member: Member = {
      id: stableId(email, name),
      name,
      designation,
      startup: cell(row, col.company) || "Not listed",
      city: parseCity(cell(row, col.city)),
      seniority: parseSeniority(cell(row, col.seniority)),
      hrFunction: inferHrFunction(designation),
      yearsOfExperience: parseYears(cell(row, col.yoe)),
      interests: [],
      hobbies: hobbyKeywords(cell(row, col.hobbies)),
      linkedin,
      email,
      whatsapp,
      joinedOn: (joinedAt ?? now.toISOString()).slice(0, 10),
      joinedAt: joinedAt ?? undefined,
      birthday,
      status: "Active",
      tags: [],
      eventsAttended: events,
      owner: null,
      lastLoginAt: null,
      loginCount: 0,
      photoUrl: parsePhoto(cell(row, col.photo)),
      formEmail: parseEmail(cell(row, col.formEmail)) || undefined,
      directoryConsent: !/^no$/i.test(cell(row, col.consent)),
      addedToCommunity: cell(row, col.added) || "Not recorded",
    };

    // Same person filling the form twice: same email, or same name + company.
    const key = email || `${name.toLowerCase()}|${member.startup.toLowerCase()}`;
    const existing = byKey.get(key) ?? [...byKey.values()].find((v) => v.member.name.toLowerCase() === name.toLowerCase() && v.member.startup.toLowerCase() === member.startup.toLowerCase());
    if (existing) {
      const first = existing.member;
      const keepEarliest = (first.joinedAt ?? "") < (member.joinedAt ?? "") ? first : member;
      // Latest submission wins for details; blanks never overwrite values.
      const merged: Member = { ...first };
      for (const [k, v] of Object.entries(member) as [keyof Member, Member[keyof Member]][]) {
        const empty = v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0);
        if (!empty) (merged as unknown as Record<string, unknown>)[k] = v;
      }
      merged.id = first.id;
      merged.joinedAt = keepEarliest.joinedAt;
      merged.joinedOn = keepEarliest.joinedOn;
      merged.eventsAttended = [...new Set([...first.eventsAttended, ...member.eventsAttended])];
      merged.hobbies = [...new Set([...first.hobbies, ...member.hobbies])];
      existing.member = merged;
      existing.submissions++;
    } else {
      byKey.set(key, { member, submissions: 1 });
    }
  }

  const members = [...byKey.values()].map((v) => v.member).sort((a, b) => (a.joinedAt ?? "").localeCompare(b.joinedAt ?? ""));
  for (const v of byKey.values()) if (v.submissions > 1) report.merged.push({ name: v.member.name, submissions: v.submissions });

  report.imported = members.length;
  report.missingWhatsapp = members.filter((m) => !m.whatsapp).length;
  report.missingYoe = members.filter((m) => m.yearsOfExperience === null).length;
  report.directoryConsentNo = members.filter((m) => m.directoryConsent === false).map((m) => m.name);
  for (const m of members) {
    const k = m.addedToCommunity ?? "Not recorded";
    report.addedToCommunity[k] = (report.addedToCommunity[k] ?? 0) + 1;
  }
  report.events = [...eventIds.keys()];

  // The form only names events; dates and venues still need to come from the team.
  const firstJoin = members[0]?.joinedOn ?? now.toISOString().slice(0, 10);
  const events: CommunityEvent[] = [...eventIds.entries()].map(([title, id]) => ({
    id,
    title,
    date: firstJoin,
    format: "In person",
    city: "To be confirmed",
    category: "Catchup",
    description: `${title} — date, city and details to be confirmed by the team.`,
    attended: members.filter((m) => m.eventsAttended.includes(id)).length,
    winners: [],
  }));

  return { importedAt: now.toISOString(), members, events, report };
}
