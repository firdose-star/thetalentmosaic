/**
 * The community data store — one copy of every record the dashboard shows,
 * shared by every service.
 *
 * It starts empty and is filled from the Mastersheet (Community Form,
 * Community Catchups, Vendor Form) when the dashboard opens. Everything else
 * — interactions, owners, tags, approvals, resources, job listings — is
 * created by admins and members as they use it. There is no sample data.
 *
 * Edits last until the page reloads; MongoDB makes them permanent.
 */
import type { CommunityEvent, JobListing, Member } from "@/types/community";

import type { ImportReport } from "@/lib/community-import/parse";
import {
  AUTOMATIONS,
  DATA_SOURCES,
  PERMISSIONS,
  type AccessRole,
  type ImportUpdate,
} from "./admin-config";
import type {
  ContactRequest,
  DataIssue,
  DuplicateCandidate,
  ProfileChangeRequest,
  Registration,
} from "./admin-queues";
import { SAMPLE_AS_OF, isoDate } from "./dates";
import {
  VENDOR_CATEGORIES,
  type Recommendation,
  type Resource,
  type Vendor,
} from "./library";

/** The community team's relationship owners. */
export const RELATIONSHIP_OWNERS = ["Shubham", "Ritushree", "Bhuvana"];

// ── Interactions (PRD §8: recorded relationship touchpoints) ────────────────

export interface Interaction {
  id: string;
  memberId: string;
  /** From the admin-managed list, e.g. "Phone call". */
  type: string;
  /** Key into the admin-managed outcomes list. */
  outcome: string;
  date: string;
  notes: string;
  /** A promised follow-up date, when one was set. */
  nextFollowUp: string;
  loggedBy: string;
}

export interface Outcome {
  key: string;
  label: string;
  /** Meaningful outcomes reset the contact clock; attempts do not. */
  meaningful: boolean;
}

export interface HealthSettings {
  /** Contact windows reported everywhere, in days. */
  windows: number[];
  /** Reminder thresholds: check-in, priority outreach, at risk. */
  thresholds: { t1: number; t2: number; t3: number };
  /** Members newer than this are "new, not yet contacted" rather than "never contacted". */
  newMemberDays: number;
  interactionTypes: string[];
  outcomes: Outcome[];
  owners: string[];
}

// ── Shared queues every section and the admin area read ─────────────────────

export interface VendorSuggestion {
  id: string;
  vendor: Omit<Vendor, "id">;
  submittedBy: string;
  submittedOn: string;
  status: "pending" | "rejected";
  reason?: string;
}

export interface HostedSessionRecord {
  id: string;
  title: string;
  city: string;
  date: string;
  time: string;
  format: "In person" | "Online" | "Hybrid";
  details: string;
  registrationUrl: string;
  cost: "Free" | "Paid";
  price?: string;
  hostId: string;
  hostName: string;
  submittedOn: string;
  status: "pending" | "rejected";
  reason?: string;
}

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
  status: "Active" | "Invited" | "Deactivated";
  /** ISO datetime, or null if never signed in. */
  lastActiveAt: string | null;
}

export type LogActorType = "Admin" | "Member" | "System";

export interface ActivityLogEntry {
  id: string;
  /** ISO datetime. */
  at: string;
  actor: string;
  actorType: LogActorType;
  action: string;
  object: string;
  /** "before → after", for edits. */
  change?: string;
}

const INTERACTION_TYPES = ["Phone call", "WhatsApp", "In-person meeting", "Email", "Event conversation", "LinkedIn comment"];

export const communityStore = {
  members: [] as Member[],
  interactions: [] as Interaction[],
  /** Every event, upcoming and past, including ones admins add. */
  events: [] as CommunityEvent[],
  /** Job listings — from the feed once connected, or added by admins. */
  jobs: [] as JobListing[],
  /** memberId → snoozed until (ISO date). */
  snoozes: new Map<string, string>(),
  library: {
    vendors: [] as Vendor[],
    categories: [...VENDOR_CATEGORIES],
    resources: [] as Resource[],
    recommendations: [] as Recommendation[],
  },
  /** Member vendor suggestions awaiting review (approved ones move to library.vendors). */
  vendorSuggestions: [] as VendorSuggestion[],
  /** Member-hosted sessions awaiting review (approved ones move to events). */
  hostedSubmissions: [] as HostedSessionRecord[],
  birthday: {
    overrides: new Map<string, Record<string, unknown>>(),
    defaults: { offsetDays: 0, time: "09:00" },
  },
  admin: {
    registrations: [] as Registration[],
    profileChanges: [] as ProfileChangeRequest[],
    contactRequests: [] as ContactRequest[],
    duplicates: [] as DuplicateCandidate[],
    importUpdates: [] as ImportUpdate[],
    issues: [] as DataIssue[],
    sources: DATA_SOURCES.map((s) => ({ ...s })),
    automations: AUTOMATIONS.map((a) => ({ ...a })),
    permissions: PERMISSIONS.map((p) => ({ ...p, roles: { ...p.roles } })),
    /** Role and status changes for derived users, keyed by user id. */
    access: new Map<string, Partial<Pick<AccessUser, "role" | "status">>>(),
    invited: [] as AccessUser[],
    /** Admin actions recorded this session, newest first. */
    log: [] as ActivityLogEntry[],
  },
  settings: {
    windows: [15, 30, 60, 90],
    thresholds: { t1: 30, t2: 60, t3: 90 },
    newMemberDays: 30,
    interactionTypes: [...INTERACTION_TYPES],
    outcomes: [
      { key: "meaningful", label: "Connected / meaningful interaction", meaningful: true },
      { key: "attempt", label: "Attempted contact, no response", meaningful: false },
      { key: "followup", label: "Follow-up needed", meaningful: true },
    ],
    owners: [...RELATIONSHIP_OWNERS],
  } as HealthSettings,
};

/** Members as they stand now, including admin edits. */
export function currentMembers(): Member[] {
  return communityStore.members;
}

export function patchMember(id: string, patch: Partial<Member>) {
  communityStore.members = communityStore.members.map((m) => (m.id === id ? { ...m, ...patch } : m));
}

/** Append an admin action to the activity log (append-only). */
export function logAdminAction(entry: Omit<ActivityLogEntry, "id" | "at" | "actorType"> & { actorType?: LogActorType }) {
  communityStore.admin.log = [
    { actorType: "Admin", ...entry, id: `log${Date.now()}${communityStore.admin.log.length}`, at: new Date().toISOString() },
    ...communityStore.admin.log,
  ];
}

// ── Loading the Mastersheet ─────────────────────────────────────────────────

export interface CommunityImportPayload {
  importedAt: string;
  members: Member[];
  events: CommunityEvent[];
  vendors: Vendor[];
  vendorCategories: string[];
  report: ImportReport;
  /** Which Mastersheet tabs were found. */
  loaded: { members: boolean; events: boolean; vendors: boolean };
}

export interface CommunitySource {
  kind: "empty" | "mastersheet";
  importedAt?: string;
  report?: ImportReport;
  loaded?: CommunityImportPayload["loaded"];
}

export let communitySource: CommunitySource = { kind: "empty" };

/** Fill the store from the Mastersheet export. */
export function applyCommunityImport(data: CommunityImportPayload) {
  communityStore.members = data.members.map((m) => ({ ...m }));
  communityStore.events = [...data.events];
  communityStore.library.vendors = [...data.vendors];
  communityStore.library.categories = [...new Set([...VENDOR_CATEGORIES, ...data.vendorCategories])];

  communityStore.admin.issues = [
    ...data.report.invalid.linkedin.map((name, i) => ({ id: `imp-li-${i}`, severity: "warning" as const, at: "On import", source: "Community Form", message: `${name}: LinkedIn isn't a profile link` })),
    ...data.report.invalid.whatsapp.map((name, i) => ({ id: `imp-wa-${i}`, severity: "warning" as const, at: "On import", source: "Community Form", message: `${name}: WhatsApp number isn't a valid mobile` })),
  ];
  communityStore.admin.sources = communityStore.admin.sources.map((s) =>
    s.id === "jobs" || !data.loaded[s.id] ? s : { ...s, minutesSinceSync: 0, status: "ok" as const },
  );
  communitySource = { kind: "mastersheet", importedAt: data.importedAt, report: data.report, loaded: data.loaded };
}

/** A member's real photo, looked up by name for avatars that only know the name. */
export function memberPhoto(name: string) {
  return communityStore.members.find((m) => m.name === name)?.photoUrl ?? null;
}

/** Today, for records created now. */
export const todayIso = () => isoDate(SAMPLE_AS_OF);
