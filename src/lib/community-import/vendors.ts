/**
 * Mastersheet › Vendor Form → Library vendors.
 *
 * Columns: Timestamp, Vendor Name, What do they do?, Category, POC Name,
 * Contact Details [Phone / WhatsApp / Email], Website / Instagram,
 * City Served, Any other details. Handles both a Google Sheets CSV export
 * and an Excel conversion (scientific-notation phone numbers).
 */
import type { Vendor } from "@/lib/sample-data/library";

import { parseCsv } from "./parse";

const clean = (v: string | undefined) => (v ?? "").replace(/\s+/g, " ").trim();
const blank = (v: string) => !v || /^(-|na|n\/a|nil|none)$/i.test(v);
const CITY_ALIASES: Record<string, string> = { bengaluru: "Bangalore", bangalore: "Bangalore", gurugram: "Gurgaon", bombay: "Mumbai" };

/** "9.876543210E9" (Excel) or "+91 98765 43210" → "9876543210". */
export function vendorPhone(raw: string) {
  const v = clean(raw);
  const sci = v.match(/^(\d+(?:\.\d+)?)e\+?(\d+)$/i);
  let digits = sci ? Math.round(Number(v)).toString() : (v.match(/(?:\+?91[\s-]?)?[6-9][\d\s-]{9,12}/)?.[0] ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return /^[6-9]\d{9}$/.test(digits) ? digits : "";
}

export interface VendorsImport {
  vendors: Vendor[];
  categories: string[];
}

export function importVendors(csv: string): VendorsImport {
  const [header = [], ...body] = parseCsv(csv);
  const find = (needle: string) => header.findIndex((h) => h.toLowerCase().includes(needle));
  const col = {
    name: find("vendor name"),
    about: find("what do they do"),
    category: find("category"),
    poc: find("poc"),
    contact: find("contact"),
    web: find("website"),
    city: find("city"),
    other: find("other details"),
  };
  const cell = (row: string[], i: number) => (i >= 0 ? clean(row[i]) : "");

  const vendors: Vendor[] = body
    .flatMap((row, i): Vendor[] => {
      const name = cell(row, col.name);
      if (!name) return [];
      const contact = cell(row, col.contact);
      const web = cell(row, col.web);
      const instagram = web.match(/instagram\.com\/([\w.]+)/i)?.[1] ?? "";
      const cityRaw = cell(row, col.city);
      const other = cell(row, col.other);
      return [{
        id: `vendor-${i + 1}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`,
        name,
        category: cell(row, col.category) || "Other",
        description: cell(row, col.about),
        city: CITY_ALIASES[cityRaw.toLowerCase()] ?? (cityRaw || "Not shared"),
        area: blank(other) ? "" : other,
        phone: vendorPhone(contact),
        email: (contact.match(/[^\s@,]+@[^\s@,]+\.[^\s@,]+/)?.[0] ?? "").toLowerCase(),
        website: instagram || blank(web) ? "" : web.replace(/^https?:\/\//, "").split("?")[0].replace(/\/$/, ""),
        instagram,
        contactName: cell(row, col.poc),
        note: "",
      }];
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { vendors, categories: [...new Set(vendors.map((v) => v.category))] };
}
