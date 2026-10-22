/**
 * Community Health and Engagement (PRD §8) — admin only.
 *
 * - engagement: who uses the platform (logins) and what they do there.
 * - activity:   every member's last login and activity status.
 * - tags:       how each member is engaged — events attended (and which),
 *               the automatic tier (online only / 1–2 events / regulars) and
 *               admin-managed custom tags.
 *
 * Computed from the SAMPLE dataset with a session store for admin edits.
 * Usage counters that have no underlying records yet are marked `sample`.
 */
import { MEMBERS, PAST_EVENTS, SAMPLE_AS_OF } from "@/lib/sample-data";
import type { Member } from "@/types/community";

export const ENGAGEMENT_TIERS = ["Connected online only", "Attended 1–2 events", "Regulars (3+ events)"] as const;
export type EngagementTier = (typeof ENGAGEMENT_TIERS)[number];

export const CUSTOM_TAGS = ["Speaker", "Volunteer", "Community champion", "Resource contributor", "Vendor contributor"];

export type ActivityStatus = "Active this week" | "Active this month" | "Inactive 30+ days" | "Never logged in";

const overrides = new Map<string, { eventsAttended: string[]; tags: string[] }>();

const withOverrides = (m: Member): Member => ({ ...m, ...overrides.get(m.id) });

function daysSinceLogin(m: Member) {
  if (!m.lastLoginAt) return null;
  return Math.floor((SAMPLE_AS_OF.getTime() - new Date(m.lastLoginAt).getTime()) / 86_400_000);
}

export function activityStatus(m: Member): ActivityStatus {
  const d = daysSinceLogin(m);
  if (d === null) return "Never logged in";
  if (d <= 7) return "Active this week";
  if (d <= 30) return "Active this month";
  return "Inactive 30+ days";
}

export function engagementTier(eventsAttended: number): EngagementTier {
  if (eventsAttended === 0) return "Connected online only";
  if (eventsAttended <= 2) return "Attended 1–2 events";
  return "Regulars (3+ events)";
}

const eventTitle = (id: string) => PAST_EVENTS.find((e) => e.id === id)?.title ?? id;

export const healthService = {
  engagement: async () => {
    const members = MEMBERS.map(withOverrides);
    const total = members.length;
    const count = (status: ActivityStatus) => members.filter((m) => activityStatus(m) === status).length;
    const week = count("Active this week");
    const month = week + count("Active this month");
    const never = count("Never logged in");

    return {
      total,
      activeWeek: week,
      activeMonth: month,
      inactive: total - month - never,
      neverLoggedIn: never,
      onlineOnly: members.filter((m) => m.eventsAttended.length === 0).length,
      /** Weekly active members, oldest first; the last week is live. */
      weeklyActive: [31, 34, 33, 38, 41, 40, 44, week].map((value, i, all) => {
        const d = new Date(SAMPLE_AS_OF);
        d.setDate(d.getDate() - 7 * (all.length - 1 - i));
        return { week: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), members: value };
      }),
      /** Share of page views this month — sample until analytics events are captured. */
      pageShare: [
        { page: "Overview", share: 31 },
        { page: "People", share: 27 },
        { page: "Opportunities", share: 19 },
        { page: "Library", share: 14 },
        { page: "Events", share: 9 },
      ],
      /** PRD §12 analytics events — sample until captured from day one. */
      counters: [
        { label: "Logins this week", value: 212 },
        { label: "Searches run", value: 386 },
        { label: "Profile views", value: 924 },
        { label: "Resources opened", value: 268 },
        { label: "Role clicks to source", value: 151 },
        { label: "Event registrations", value: 94 },
      ],
    };
  },

  activity: async () =>
    MEMBERS.map(withOverrides)
      .map((m) => ({
        id: m.id,
        name: m.name,
        startup: m.startup,
        city: m.city,
        lastLoginAt: m.lastLoginAt,
        status: activityStatus(m),
        eventsAttended: m.eventsAttended.length,
      }))
      .sort((a, b) => (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? "")),

  tags: async () => {
    const members = MEMBERS.map(withOverrides).map((m) => ({
      id: m.id,
      name: m.name,
      startup: m.startup,
      eventsAttended: m.eventsAttended.map((id) => ({ id, title: eventTitle(id) })),
      tier: engagementTier(m.eventsAttended.length),
      tags: m.tags,
    }));
    return {
      members,
      tierCounts: ENGAGEMENT_TIERS.map((tier) => ({ tier, count: members.filter((m) => m.tier === tier).length })),
      tagCounts: CUSTOM_TAGS.map((tag) => ({ tag, count: members.filter((m) => m.tags.includes(tag)).length })),
      events: PAST_EVENTS.map((e) => ({ id: e.id, title: e.title, date: e.date, city: e.city })),
    };
  },

  /** Admin: tick which events a member attended and set their tags. */
  updateEngagement: async (input: { memberId: string; eventsAttended: string[]; tags: string[] }) => {
    overrides.set(input.memberId, { eventsAttended: input.eventsAttended, tags: input.tags });
  },
};
