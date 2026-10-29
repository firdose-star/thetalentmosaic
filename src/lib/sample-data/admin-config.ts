/**
 * Admin configuration — which automations exist, which data sources feed the
 * dashboard, and what each role may do. No sample records: statuses start
 * at "scheduled" / "not connected" and change only through real activity.
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
  { id: "bd", name: "Birthday messages", description: "Drafts a message for each birthday. Once an admin approves it, it opens on WhatsApp at the chosen time.", frequency: "Daily", time: "09:00", status: "scheduled", enabled: true },
  { id: "fu", name: "Follow-up digest", description: "Overdue follow-ups per relationship owner, in-app and by email.", frequency: "Weekly", weekday: 1, time: "08:00", status: "scheduled", enabled: true },
  { id: "wk", name: "Weekly community digest", description: "New joiners, roles and upcoming events by email.", frequency: "Weekly", weekday: 1, time: "08:00", status: "scheduled", enabled: true },
  { id: "ev", name: "Event reminders", description: "Reminds registrants 24 hours and 2 hours before each event.", frequency: "Before each event", time: "", status: "scheduled", enabled: true },
  { id: "nj", name: "Welcome message for new members", description: "A welcome email with the directory and library, sent on approval.", frequency: "On approval", time: "", status: "scheduled", enabled: true },
  { id: "jd", name: "Roles digest", description: "Matching roles by city and seniority, once the job feed is connected.", frequency: "Twice weekly", time: "10:00", status: "scheduled", enabled: false },
  { id: "ap", name: "Pending approval nudge", description: "Pings admins when items wait longer than 48 hours.", frequency: "Daily", time: "18:00", status: "scheduled", enabled: false },
];

export type SourceStatus = "ok" | "warn" | "bad" | "off";

export interface DataSource {
  id: "members" | "vendors" | "events";
  name: string;
  type: string;
  schedule: string;
  /** Minutes since the last successful load; null if never. */
  minutesSinceSync: number | null;
  status: SourceStatus;
}

/** Where the dashboard's data comes from. Statuses are set by the real import. */
export const DATA_SOURCES: DataSource[] = [
  { id: "members", name: "Mastersheet › Community Form", type: "Google Sheets export", schedule: "Loaded when the dashboard opens", minutesSinceSync: null, status: "off" },
  { id: "events", name: "Mastersheet › Community Catchups", type: "Google Sheets export", schedule: "Loaded when the dashboard opens", minutesSinceSync: null, status: "off" },
  { id: "vendors", name: "Mastersheet › Vendor Form", type: "Google Sheets export", schedule: "Loaded when the dashboard opens", minutesSinceSync: null, status: "off" },
];

export interface ImportUpdate {
  id: string;
  memberId: string;
  field: "designation" | "startup" | "city";
  label: string;
  to: string;
}

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
  perm("edit-events", "Add and edit events, tag attendees", false, false),
  perm("imports", "Run imports and the scraper", false, false),
  perm("automations", "Manage automations and access", false, false, true),
  perm("logs", "View activity logs", false, false, true),
];
