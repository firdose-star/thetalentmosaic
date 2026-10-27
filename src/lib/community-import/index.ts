/**
 * The whole Mastersheet → dashboard records: members (Community Form),
 * events (Community Catchups) and vendors (Vendor Form). Members' "Events
 * Attended" are linked to the matching catchup by name.
 */
import type { CommunityImportPayload } from "@/lib/sample-data";

import { eventKey, importCatchups } from "./catchups";
import { importCommunityForm } from "./parse";
import { importVendors } from "./vendors";

export function importMastersheet(
  files: { form?: string; catchups?: string; vendors?: string },
  now = new Date(),
): CommunityImportPayload {
  const form = importCommunityForm(files.form ?? "", now);
  const catchups = files.catchups ? importCatchups(files.catchups) : { events: [], skipped: [] };
  const vendors = files.vendors ? importVendors(files.vendors) : { vendors: [], categories: [] };

  // Point each event the form names at the real catchup with the same name.
  const remap = new Map<string, string>();
  const unmatched = form.events.filter((fe) => {
    const match = catchups.events.find((e) => eventKey(e.title) === eventKey(fe.title));
    if (match) remap.set(fe.id, match.id);
    return !match;
  });
  const members = form.members.map((m) => ({
    ...m,
    eventsAttended: [...new Set(m.eventsAttended.map((id) => remap.get(id) ?? id))],
  }));
  const events = [...catchups.events, ...unmatched].map((e) => ({
    ...e,
    attended: members.filter((m) => m.eventsAttended.includes(e.id)).length,
  }));

  return {
    importedAt: form.importedAt,
    members: files.form ? members : [],
    events,
    vendors: vendors.vendors,
    vendorCategories: vendors.categories,
    report: {
      ...form.report,
      catchups: catchups.events.length,
      unmatchedEvents: unmatched.map((e) => e.title),
      vendors: vendors.vendors.length,
    },
    loaded: { members: Boolean(files.form), events: Boolean(files.catchups), vendors: Boolean(files.vendors) },
  };
}
