/**
 * Community Health and Engagement (PRD §8) — admin only.
 *
 * `data()` returns every member with their relationship state derived from
 * recorded interactions (last meaningful contact, last attempt, pending
 * follow-up, latest touchpoint), plus the admin settings. The tabs compute
 * their metrics from this with the pure functions in `../metrics`, so the
 * combined view and each owner's view always agree.
 *
 * Every mutation is an admin action: log or edit interactions, assign
 * owners, snooze, fix member data, tag events and tags, and manage the
 * lists behind the dashboard (owners, interaction types, outcomes,
 * thresholds). Backed by the community store until the API exists.
 */
import {
  SAMPLE_AS_OF,
  communityStore,
  OWNER_EMAILS,
  isoDate,
  patchMember,
  type HealthSettings,
  type Interaction,
  type Outcome,
} from "@/lib/sample-data";
import type { Member } from "@/types/community";

export interface Touchpoint {
  date: string;
  /** "Phone call", "LinkedIn comment", "Event: Monsoon HR Meetup", … */
  label: string;
}

export interface HealthMember extends Member {
  joinedDaysAgo: number;
  loginDaysAgo: number | null;
  lastMeaningful: Interaction | null;
  lastAttempt: Interaction | null;
  /** Days since the last meaningful interaction; null if never. */
  daysSinceContact: number | null;
  pendingFollowUp: string | null;
  followUpOverdue: boolean;
  snoozedUntil: string | null;
  /** Most recent touchpoint of any kind, including events attended. */
  latestTouch: Touchpoint | null;
}

export interface HealthData {
  asOf: string;
  members: HealthMember[];
  interactions: Interaction[];
  settings: HealthSettings;
  /** Work email per relationship owner, where known. */
  ownerEmails: Record<string, string>;
  events: { id: string; title: string; date: string; city: string; attended: number }[];
  awaitingApproval: number;
}

const DAY = 86_400_000;
const daysAgo = (iso: string) =>
  Math.floor((SAMPLE_AS_OF.getTime() - new Date(`${iso.slice(0, 10)}T00:00`).getTime()) / DAY);

function derive(m: Member): HealthMember {
  const { interactions, settings, snoozes } = communityStore;
  const meaningful = new Set(settings.outcomes.filter((o) => o.meaningful).map((o) => o.key));
  const mine = interactions
    .filter((x) => x.memberId === m.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const lastMeaningful = mine.find((x) => meaningful.has(x.outcome)) ?? null;
  const lastAttempt = mine.find((x) => !meaningful.has(x.outcome)) ?? null;

  // A promised follow-up stays open until a later meaningful interaction.
  const promise = mine.find((x) => x.nextFollowUp);
  const resolved = promise && mine.some((x) => meaningful.has(x.outcome) && x.date > promise.date);
  const pendingFollowUp = promise && !resolved ? promise.nextFollowUp : null;

  const lastEvent = m.eventsAttended
    .map((id) => communityStore.events.find((e) => e.id === id))
    .filter((e) => e !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const touches: Touchpoint[] = [
    ...(mine[0] ? [{ date: mine[0].date, label: mine[0].type }] : []),
    ...(lastEvent ? [{ date: lastEvent.date, label: `Event: ${lastEvent.title}` }] : []),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const snoozedUntil = snoozes.get(m.id) ?? null;

  return {
    ...m,
    joinedDaysAgo: daysAgo(m.joinedOn),
    loginDaysAgo: m.lastLoginAt ? daysAgo(m.lastLoginAt) : null,
    lastMeaningful,
    lastAttempt,
    daysSinceContact: lastMeaningful ? daysAgo(lastMeaningful.date) : null,
    pendingFollowUp,
    followUpOverdue: Boolean(pendingFollowUp && pendingFollowUp < isoDate(SAMPLE_AS_OF)),
    snoozedUntil: snoozedUntil && snoozedUntil > isoDate(SAMPLE_AS_OF) ? snoozedUntil : null,
    latestTouch: touches[0] ?? null,
  };
}

/** Events that have happened — the ones members can have attended. */
const pastEvents = () =>
  communityStore.events
    .filter((e) => e.date < isoDate(SAMPLE_AS_OF))
    .sort((a, b) => b.date.localeCompare(a.date));

const nextId = () => `int${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const healthService = {
  data: async (): Promise<HealthData> => ({
    asOf: isoDate(SAMPLE_AS_OF),
    members: communityStore.members.map(derive),
    interactions: [...communityStore.interactions],
    settings: structuredClone(communityStore.settings),
    ownerEmails: { ...OWNER_EMAILS },
    events: pastEvents().map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      city: e.city,
      attended: communityStore.members.filter((m) => m.eventsAttended.includes(e.id)).length,
    })),
    awaitingApproval: communityStore.admin.registrations.length,
  }),

  // ── Interactions ──────────────────────────────────────────────────────────
  logInteraction: async (input: Omit<Interaction, "id">) => {
    communityStore.interactions = [{ ...input, id: nextId() }, ...communityStore.interactions];
  },
  updateInteraction: async (input: Interaction) => {
    communityStore.interactions = communityStore.interactions.map((x) => (x.id === input.id ? input : x));
  },
  deleteInteraction: async (id: string) => {
    communityStore.interactions = communityStore.interactions.filter((x) => x.id !== id);
  },
  /** "Mark as contacted": a meaningful touchpoint dated today. */
  markContacted: async ({ memberId, by }: { memberId: string; by: string }) => {
    const meaningful = communityStore.settings.outcomes.find((o) => o.meaningful)?.key ?? "meaningful";
    communityStore.interactions = [
      {
        id: nextId(),
        memberId,
        type: communityStore.settings.interactionTypes[0] ?? "Phone call",
        outcome: meaningful,
        date: isoDate(SAMPLE_AS_OF),
        notes: "Marked as contacted",
        nextFollowUp: "",
        loggedBy: by,
      },
      ...communityStore.interactions,
    ];
  },

  // ── Members ───────────────────────────────────────────────────────────────
  setOwner: async ({ memberId, owner }: { memberId: string; owner: string | null }) => {
    patchMember(memberId, { owner });
  },
  snooze: async ({ memberId, days }: { memberId: string; days: number }) => {
    if (days <= 0) communityStore.snoozes.delete(memberId);
    else {
      const until = new Date(SAMPLE_AS_OF);
      until.setDate(until.getDate() + days);
      communityStore.snoozes.set(memberId, isoDate(until));
    }
  },
  /** Data-quality fixes and engagement tagging (events attended, tags). */
  updateMember: async ({ memberId, patch }: { memberId: string; patch: Partial<Member> }) => {
    patchMember(memberId, patch);
  },

  // ── Settings: thresholds, owners, interaction types, outcomes ─────────────
  updateThresholds: async (input: Pick<HealthSettings, "thresholds" | "windows" | "newMemberDays">) => {
    Object.assign(communityStore.settings, input);
  },

  addOwner: async (name: string) => {
    if (communityStore.settings.owners.includes(name)) throw new Error(`${name} is already an owner`);
    communityStore.settings.owners.push(name);
  },
  renameOwner: async ({ from, to }: { from: string; to: string }) => {
    communityStore.settings.owners = communityStore.settings.owners.map((o) => (o === from ? to : o));
    communityStore.members.filter((m) => m.owner === from).forEach((m) => patchMember(m.id, { owner: to }));
  },
  /** Removing an owner reassigns their members (or leaves them unassigned). */
  removeOwner: async ({ name, reassignTo }: { name: string; reassignTo: string | null }) => {
    communityStore.settings.owners = communityStore.settings.owners.filter((o) => o !== name);
    communityStore.members.filter((m) => m.owner === name).forEach((m) => patchMember(m.id, { owner: reassignTo }));
  },

  addType: async (name: string) => {
    if (communityStore.settings.interactionTypes.includes(name)) throw new Error(`${name} already exists`);
    communityStore.settings.interactionTypes.push(name);
  },
  renameType: async ({ from, to }: { from: string; to: string }) => {
    communityStore.settings.interactionTypes = communityStore.settings.interactionTypes.map((t) => (t === from ? to : t));
    communityStore.interactions = communityStore.interactions.map((x) => (x.type === from ? { ...x, type: to } : x));
  },
  /** PRD §9: removing a type in use asks where its records go. */
  removeType: async ({ name, remapTo }: { name: string; remapTo: string }) => {
    communityStore.settings.interactionTypes = communityStore.settings.interactionTypes.filter((t) => t !== name);
    communityStore.interactions = communityStore.interactions.map((x) => (x.type === name ? { ...x, type: remapTo } : x));
  },

  saveOutcome: async (outcome: Outcome) => {
    const exists = communityStore.settings.outcomes.some((o) => o.key === outcome.key);
    communityStore.settings.outcomes = exists
      ? communityStore.settings.outcomes.map((o) => (o.key === outcome.key ? outcome : o))
      : [...communityStore.settings.outcomes, outcome];
  },
  removeOutcome: async ({ key, remapTo }: { key: string; remapTo: string }) => {
    communityStore.settings.outcomes = communityStore.settings.outcomes.filter((o) => o.key !== key);
    communityStore.interactions = communityStore.interactions.map((x) => (x.outcome === key ? { ...x, outcome: remapTo } : x));
  },
};
