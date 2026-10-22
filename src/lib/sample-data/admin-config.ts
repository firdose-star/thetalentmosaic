/**
 * Admin configuration — the only admin data that is not derived from the
 * community records: which automations exist, which data sources are
 * connected, and what each role may do. Counts, users and the activity log
 * are all computed live from the shared store.
 */

export type AutomationStatus = "scheduled" | "running" | "succeeded" | "failed";

export interface Automation {
  id: string;
  name: string;
  description: string;
  frequency: "Daily" | "Weekly" | "Twice weekly" | "On approval" | "Before each event";
  /** "HH:MM", or "" for event-driven automations. */
  time: string;
  /** Weekday for weekly runs (0 = Sunday). */
  weekday?: number;
  status: AutomationStatus;
  enabled: boolean;
}

export const AUTOMATIONS: Automation[] = [
  { id: "bd", name: "Birthday messages", description: "Drafts a message for each birthday. Once an admin approves it, it opens on WhatsApp at the chosen time.", frequency: "Daily", time: "09:00", status: "succeeded", enabled: true },
  { id: "fu", name: "Follow-up digest", description: "Overdue follow-ups per relationship owner, in-app and by email.", frequency: "Weekly", weekday: 1, time: "08:00", status: "succeeded", enabled: true },
  { id: "wk", name: "Weekly community digest", description: "New joiners, top roles and upcoming events by email.", frequency: "Weekly", weekday: 1, time: "08:00", status: "succeeded", enabled: true },
  { id: "ev", name: "Event reminders", description: "Reminds registrants 24 hours and 2 hours before each event.", frequency: "Before each event", time: "", status: "scheduled", enabled: true },
  { id: "nj", name: "Welcome message for new members", description: "A welcome email with the directory and library, sent on approval.", frequency: "On approval", time: "", status: "succeeded", enabled: true },
  { id: "jd", name: "Roles digest", description: "Matching roles by city and seniority.", frequency: "Twice weekly", time: "10:00", status: "failed", enabled: true },
  { id: "ap", name: "Pending approval nudge", description: "Pings admins when items wait longer than 48 hours.", frequency: "Daily", time: "18:00", status: "scheduled", enabled: false },
];

export type SourceStatus = "ok" | "warn" | "bad";

export interface DataSource {
  id: "members" | "vendors" | "jobs" | "registrations";
  name: string;
  type: string;
  schedule: string;
  /** Minutes since the last successful sync. */
  minutesSinceSync: number;
  status: SourceStatus;
}

export const DATA_SOURCES: DataSource[] = [
  { id: "members", name: "Member master sheet", type: "Google Sheets", schedule: "Two-way sync every 15 minutes", minutesSinceSync: 12, status: "ok" },
  { id: "vendors", name: "Vendor directory sheet", type: "Google Sheets", schedule: "Hourly import", minutesSinceSync: 60, status: "ok" },
  { id: "jobs", name: "Job feed", type: "Scraper API", schedule: "Every 2 hours", minutesSinceSync: 14, status: "warn" },
  { id: "registrations", name: "Registration form", type: "Form import", schedule: "Daily import", minutesSinceSync: 180, status: "ok" },
];

export interface ImportUpdate {
  id: string;
  memberId: string;
  field: "designation" | "startup" | "city";
  label: string;
  to: string;
}

/** Changes the member master sheet has that the CRM doesn't yet. */
export const IMPORT_UPDATES: ImportUpdate[] = [
  { id: "i1", memberId: "m8", field: "designation", label: "Designation", to: "Head of People Analytics" },
  { id: "i2", memberId: "m13", field: "startup", label: "Startup", to: "Zesto Labs" },
  { id: "i3", memberId: "m22", field: "city", label: "City", to: "Pune" },
];

export const ACCESS_ROLES = ["Member", "Relationship owner", "Admin"] as const;
export type AccessRole = (typeof ACCESS_ROLES)[number];

export interface Permission {
  id: string;
  label: string;
  roles: Record<AccessRole, boolean>;
  /** Locked for Admin so nobody can lock the team out. */
  locked?: boolean;
}

const perm = (id: string, label: string, member: boolean, owner: boolean, locked = false): Permission => ({
  id,
  label,
  roles: { Member: member, "Relationship owner": owner, Admin: true },
  locked,
});

export const PERMISSIONS: Permission[] = [
  perm("browse", "Browse people, library, roles and events", true, true),
  perm("contact", "Request contact details", true, true),
  perm("profile", "Edit own profile (sent for admin approval)", true, true),
  perm("recommend", "Recommend vendors and resources", true, true),
  perm("host", "Submit a hosted session", true, true),
  perm("log", "Log interactions for their members", false, true),
  perm("see-contact", "See contact details", false, true),
  perm("approve-subs", "Approve submissions", false, false),
  perm("approve-reg", "Approve registrations", false, false),
  perm("edit-members", "Edit member records", false, false),
  perm("imports", "Run imports and the scraper", false, false),
  perm("automations", "Manage automations and access", false, false, true),
  perm("logs", "View activity logs", false, false, true),
];

/** Second record for each duplicate pair — what the admin compares side by side. */
export const DUPLICATE_RECORDS: Record<string, { name: string; email: string; startup: string; city: string }> = {
  d1: { name: "K. Rao", email: "hr.rao@gmail.example", startup: "Gridwise", city: "Bangalore" },
  d2: { name: "Tara Bhatia", email: "tara@oldco.example", startup: "OldCo", city: "Mumbai" },
  d3: { name: "Pooja R.", email: "pooja.r@orbitly.example", startup: "Orbitly", city: "Pune" },
};
