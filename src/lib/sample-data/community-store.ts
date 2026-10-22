/**
 * The SAMPLE session store — one mutable copy of member records, recorded
 * interactions and admin settings, shared by every service.
 *
 * An admin edit (owner, tags, events attended, a fixed LinkedIn) shows up on
 * People, Overview and Community Health at once, exactly as it will when all
 * of them read from MongoDB. Changes last until the page reloads.
 */
import type { CommunityEvent, Member } from "@/types/community";

import { SAMPLE_AS_OF, addDays, isoDate } from "./dates";
import { PAST_EVENTS, UPCOMING_EVENTS } from "./events";
import { MEMBERS, RELATIONSHIP_OWNERS } from "./members";
import {
  CONTACT_REQUESTS,
  DATA_ISSUES,
  DUPLICATES,
  PROFILE_CHANGES,
  REGISTRATIONS,
  SUBMISSIONS,
} from "./admin-queues";
import {
  AUTOMATIONS,
  DATA_SOURCES,
  IMPORT_UPDATES,
  PERMISSIONS,
  type AccessRole,
} from "./admin-config";
import {
  RECOMMENDATIONS,
  RESOURCES,
  VENDOR_CATEGORIES,
  VENDORS,
  type Vendor,
} from "./library";

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

const NOTES = [
  "Checked in on current priorities and community needs.",
  "Discussed a hiring challenge.",
  "Talked about an upcoming offsite and vendors.",
  "Caught up on what the community could do better.",
  "Shared a few useful resources.",
  "Commented on their LinkedIn post about hiring.",
];

const TYPES = ["Phone call", "WhatsApp", "In-person meeting", "Email", "Event conversation", "LinkedIn comment"];

/** Ported from the prototype: a realistic spread of recent, stale and missing contact. */
function seedInteractions(): Interaction[] {
  const out: Interaction[] = [];
  const pattern = ["n", "r2", "r10", "m45", "m75", "o120", "r20", "n", "r6", "m35", "r14", "o140"];
  const days: Record<string, number> = { r2: 2, r10: 10, r20: 20, r6: 6, r14: 14, m35: 35, m45: 45, m75: 75, o120: 120, o140: 140 };

  MEMBERS.forEach((m, i) => {
    const joinedAgo = Math.round((SAMPLE_AS_OF.getTime() - new Date(`${m.joinedOn}T00:00`).getTime()) / 86_400_000);
    const key = pattern[(i * 5 + 2) % 12];
    let d: number | null = key === "n" || (i < 6 && i % 2 === 0) ? null : days[key];
    if (d !== null && d > joinedAgo) d = Math.max(0, joinedAgo - 1);
    const by = m.owner ?? RELATIONSHIP_OWNERS[0];

    if (d !== null) {
      const followUp = i % 7 === 3;
      out.push({
        id: `int${out.length + 1}`,
        memberId: m.id,
        type: TYPES[i % TYPES.length],
        outcome: followUp ? "followup" : "meaningful",
        date: isoDate(addDays(SAMPLE_AS_OF, -d)),
        notes: NOTES[i % NOTES.length],
        nextFollowUp: followUp ? isoDate(addDays(SAMPLE_AS_OF, i % 2 ? -6 : 12)) : "",
        loggedBy: by,
      });
      if (joinedAgo > d + 35) {
        out.push({
          id: `int${out.length + 1}`,
          memberId: m.id,
          type: TYPES[(i + 2) % TYPES.length],
          outcome: "meaningful",
          date: isoDate(addDays(SAMPLE_AS_OF, -(d + 35))),
          notes: NOTES[(i + 1) % NOTES.length],
          nextFollowUp: "",
          loggedBy: by,
        });
      }
    }
    if (i % 3 === 0 && joinedAgo > 3 && (d !== null || i % 2 === 0)) {
      out.push({
        id: `int${out.length + 1}`,
        memberId: m.id,
        type: "Phone call",
        outcome: "attempt",
        date: isoDate(addDays(SAMPLE_AS_OF, -((i % 3) + 1))),
        notes: "No answer",
        nextFollowUp: "",
        loggedBy: by,
      });
    }
  });
  return out;
}

export const communityStore = {
  members: MEMBERS.map((m) => ({ ...m })),
  interactions: seedInteractions(),
  /** Every event, upcoming and past, including ones admins add. */
  events: [...UPCOMING_EVENTS, ...PAST_EVENTS] as CommunityEvent[],
  /** memberId → snoozed until (ISO date). */
  snoozes: new Map<string, string>(),
  library: {
    vendors: [...VENDORS],
    categories: [...VENDOR_CATEGORIES],
    resources: [...RESOURCES],
    recommendations: [...RECOMMENDATIONS],
  },
  /** Member vendor suggestions awaiting review (approved ones move to library.vendors). */
  vendorSuggestions: SUBMISSIONS.filter((s) => s.kind === "Vendor").map<VendorSuggestion>((s) => ({
    id: s.id,
    vendor: {
      name: s.name,
      category: s.category,
      description: s.description,
      city: s.id === "s1" ? "Bangalore" : "Goa",
      area: "",
      phone: "",
      website: s.id === "s1" ? "brewhouse.example" : "heritagegoa.example",
      instagram: "",
      email: "",
      note: "",
    },
    submittedBy: s.submittedBy,
    submittedOn: isoDate(addDays(SAMPLE_AS_OF, s.submittedAt === "Today" ? 0 : -1)),
    status: "pending",
  })),
  /** Member-hosted sessions awaiting review (approved ones move to events). */
  hostedSubmissions: [] as HostedSessionRecord[],
  birthday: {
    overrides: new Map<string, Record<string, unknown>>(),
    defaults: { offsetDays: 0, time: "09:00" },
  },
  admin: {
    registrations: [...REGISTRATIONS],
    profileChanges: [...PROFILE_CHANGES],
    contactRequests: [...CONTACT_REQUESTS],
    duplicates: [...DUPLICATES],
    importUpdates: [...IMPORT_UPDATES],
    issues: [...DATA_ISSUES],
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
    interactionTypes: [...TYPES],
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
