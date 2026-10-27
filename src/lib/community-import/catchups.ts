/**
 * Mastersheet › Community Catchups → events.
 *
 * Columns: Event Hosted Date, Event Name, Description, City ("Bangalore,
 * Koramangala" → city + area), Moments (a highlight photo or video on
 * Drive), Photos [All] (the Drive folder).
 */
import type { CommunityEvent } from "@/types/community";

import { parseCsv } from "./parse";

const clean = (v: string | undefined) => (v ?? "").replace(/\s+/g, " ").trim();
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "Jan 11, 2025" → "2025-01-11"; also accepts "11/1/2025" (M/D/YYYY) and ISO. */
export function parseEventDate(raw: string): string | null {
  const v = clean(raw);
  let m = v.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})$/);
  if (m) {
    const month = MONTHS.indexOf(m[1].toLowerCase());
    if (month >= 0) return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const CITY_ALIASES: Record<string, string> = { bengaluru: "Bangalore", gurugram: "Gurgaon", bombay: "Mumbai" };

/** A normalised event name, so "Toast To Talent 5.0" matches "Toast to Talent 5.0 ". */
export const eventKey = (name: string) => clean(name).toLowerCase().replace(/[^a-z0-9.]+/g, "");

function category(name: string) {
  const n = name.toLowerCase();
  if (n.includes("toast")) return "Toast to Talent";
  if (n.includes("talentable")) return "Talentable";
  if (n.includes("bootcamp")) return "Bootcamp";
  if (/cricket|sport|run|match/.test(n)) return "Sports";
  if (/ai|workshop|shift/.test(n)) return "Workshop";
  return "Catchup";
}

export interface CatchupsImport {
  events: CommunityEvent[];
  skipped: string[];
}

export function importCatchups(csv: string): CatchupsImport {
  const [header = [], ...body] = parseCsv(csv);
  const find = (needle: string) => header.findIndex((h) => h.toLowerCase().includes(needle));
  const col = {
    date: find("date"),
    name: find("event name"),
    description: find("description"),
    city: find("city"),
    moments: find("moments"),
    photos: find("photos"),
  };
  const cell = (row: string[], i: number) => (i >= 0 ? clean(row[i]) : "");

  const events: CommunityEvent[] = [];
  const skipped: string[] = [];

  for (const row of body) {
    const title = cell(row, col.name);
    const date = parseEventDate(cell(row, col.date));
    if (!title || !date) {
      if (title || cell(row, col.date)) skipped.push(title || cell(row, col.date));
      continue;
    }
    const [cityRaw, ...areaParts] = cell(row, col.city).split(",").map(clean);
    const online = /online/i.test(cityRaw);
    const city = online ? "Online" : (CITY_ALIASES[cityRaw.toLowerCase()] ?? cityRaw) || "To be confirmed";
    const area = areaParts.join(", ");
    const moments = cell(row, col.moments);
    const photos = cell(row, col.photos) || (moments.includes("/folders/") ? moments : "");

    events.push({
      id: `ev-${date}-${eventKey(title).replace(/\./g, "-")}`,
      title,
      date,
      format: online ? "Online" : "In person",
      city,
      venue: online ? "Online session" : [area, city].filter(Boolean).join(", "),
      category: category(title),
      description: cell(row, col.description) || title,
      momentsUrl: moments || undefined,
      photosUrl: photos || undefined,
      winners: [],
    });
  }

  return { events: events.sort((a, b) => a.date.localeCompare(b.date)), skipped };
}
