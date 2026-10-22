/**
 * Community Health metrics (PRD §8) as pure functions.
 *
 * Core rule — live denominators: every metric is "n / total" where total is
 * the members in the current view (the whole community, or one owner's
 * members), with a percentage, recalculated on every render.
 */
import type { HealthSettings, Interaction } from "@/lib/sample-data";
import { experienceBand } from "@/types/community";

import type { HealthData, HealthMember } from "./services/health.service";

/** "" = everyone, "__none" = unassigned, otherwise an owner's name. */
export type Scope = string;
export const UNASSIGNED = "__none";

export function scopeMembers(members: HealthMember[], scope: Scope) {
  if (!scope) return members;
  if (scope === UNASSIGNED) return members.filter((m) => !m.owner);
  return members.filter((m) => m.owner === scope);
}

export function scopeLabel(scope: Scope) {
  if (!scope) return "All members (combined)";
  if (scope === UNASSIGNED) return "Unassigned";
  return `${scope}’s members`;
}

export function pct(n: number, d: number) {
  return d ? `${((n / d) * 100).toFixed(1)}%` : "0.0%";
}

// ── Status ──────────────────────────────────────────────────────────────────

export type Tone = "ok" | "warn" | "bad" | "muted";

export function status(m: HealthMember, s: HealthSettings): { label: string; tone: Tone } {
  const d = m.daysSinceContact;
  if (d === null) {
    return m.joinedDaysAgo <= s.newMemberDays
      ? { label: "New, not yet contacted", tone: "warn" }
      : { label: "Never contacted", tone: "bad" };
  }
  if (d <= s.thresholds.t1) return { label: "Recently engaged", tone: "ok" };
  if (d <= s.thresholds.t2) return { label: "Check-in due", tone: "warn" };
  if (d <= s.thresholds.t3) return { label: "Priority outreach", tone: "warn" };
  return { label: "At risk", tone: "bad" };
}

export const STATUS_LABELS = [
  "Recently engaged",
  "Check-in due",
  "Priority outreach",
  "At risk",
  "New, not yet contacted",
  "Never contacted",
];

export function isAtRisk(m: HealthMember, s: HealthSettings) {
  const d = m.daysSinceContact;
  return (
    (d !== null && d > s.thresholds.t3) ||
    (d === null && m.joinedDaysAgo > s.newMemberDays) ||
    (m.eventsAttended.length >= 2 && (d === null || d > s.thresholds.t2))
  );
}

export function isFollowUpDue(m: HealthMember, s: HealthSettings) {
  return (m.daysSinceContact !== null && m.daysSinceContact > s.thresholds.t1) || m.followUpOverdue;
}

// ── Metric definitions ─────────────────────────────────────────────────────

export interface Metric {
  key: string;
  label: string;
  sub: string;
  /** How it is calculated — the "Details" toggle. */
  calc: string;
  members: HealthMember[];
}

/** The eight summary cards (PRD §8). */
export function summaryCards(list: HealthMember[], s: HealthSettings, asOf: string): Metric[] {
  const month = asOf.slice(0, 7);
  return [
    { key: "total", label: "All approved members", sub: "Everyone in this view", calc: "All approved member records. This is the denominator for every other metric.", members: list },
    { key: "recent", label: `Contacted in the last ${s.thresholds.t1} days`, sub: "Recently engaged", calc: `Members with a meaningful interaction in the last ${s.thresholds.t1} days ÷ members in view. Attempts don't count.`, members: list.filter((m) => m.daysSinceContact !== null && m.daysSinceContact <= s.thresholds.t1) },
    { key: "never", label: "No recorded relationship interaction", sub: "Never contacted", calc: "Members with no meaningful interaction recorded since joining ÷ members in view.", members: list.filter((m) => m.daysSinceContact === null) },
    { key: "due", label: `${s.thresholds.t1}, ${s.thresholds.t2} or ${s.thresholds.t3} days overdue`, sub: "Follow-ups due", calc: `Last meaningful contact more than ${s.thresholds.t1} days ago, or a promised follow-up date has passed ÷ members in view.`, members: list.filter((m) => isFollowUpDue(m, s)) },
    { key: "new", label: "Newly approved members", sub: "Approved this month", calc: "Members approved in the current calendar month ÷ members in view.", members: list.filter((m) => m.joinedOn.startsWith(month)) },
    { key: "events", label: "Unique members attending events", sub: "Event reach", calc: "Unique members who attended at least one event ÷ members in view. One person at three events counts once.", members: list.filter((m) => m.eventsAttended.length > 0) },
    { key: "platform", label: "Members logged in within 30 days", sub: "Platform active", calc: "Members with a successful login in the last 30 days ÷ members in view. Kept separate from offline engagement.", members: list.filter((m) => m.loginDaysAgo !== null && m.loginDaysAgo <= 30) },
    { key: "risk", label: "Members meeting disengagement criteria", sub: "At risk", calc: `No meaningful contact for over ${s.thresholds.t3} days, never contacted after ${s.newMemberDays} days, or attended 2+ events with no contact for ${s.thresholds.t2}+ days ÷ members in view.`, members: list.filter((m) => isAtRisk(m, s)) },
  ];
}

/** Contacted within each window (15 / 30 / 60 / 90 days by default). */
export function contactWindows(list: HealthMember[], s: HealthSettings): Metric[] {
  return s.windows.map((days) => ({
    key: `within-${days}`,
    label: `Contacted in the last ${days} days`,
    sub: "Meaningful interaction",
    calc: `Members whose last meaningful interaction was within ${days} days ÷ members in view.`,
    members: list.filter((m) => m.daysSinceContact !== null && m.daysSinceContact <= days),
  }));
}

/** "Members requiring attention" — six actionable lists. */
export function attentionLists(list: HealthMember[], s: HealthSettings): Metric[] {
  return [
    { key: "a-never", label: "Never contacted", sub: "Initiate an introduction", calc: "No meaningful interaction since joining (past the new-member window).", members: list.filter((m) => m.daysSinceContact === null && m.joinedDaysAgo > s.newMemberDays) },
    { key: "a-overdue", label: "Overdue follow-ups", sub: `Crossed ${s.thresholds.t1}/${s.thresholds.t2}/${s.thresholds.t3} days, or a promise is open`, calc: "Last meaningful contact past the first threshold, or a promised follow-up date has passed.", members: list.filter((m) => isFollowUpDue(m, s)) },
    { key: "a-new", label: "Joined recently, not engaged", sub: "Welcome them", calc: `Joined in the last ${s.newMemberDays} days with no meaningful interaction.`, members: list.filter((m) => m.daysSinceContact === null && m.joinedDaysAgo <= s.newMemberDays) },
    { key: "a-lapsed", label: "Previously engaged, now inactive", sub: "Engagement drop-off", calc: `Attended events or had contact before, but no meaningful contact in ${s.thresholds.t2}+ days.`, members: list.filter((m) => (m.eventsAttended.length > 0 || m.lastMeaningful) && m.daysSinceContact !== null && m.daysSinceContact > s.thresholds.t2) },
    { key: "a-noevent", label: "Never attended an event", sub: "Connected online only", calc: "No recorded event attendance.", members: list.filter((m) => m.eventsAttended.length === 0) },
    { key: "a-pending", label: "Pending follow-up or request", sub: "Close the loop", calc: "A promised follow-up date is set and no meaningful interaction has happened since.", members: list.filter((m) => m.pendingFollowUp) },
  ];
}

/** Outreach queue groups, most urgent first. Snoozed members are hidden. */
export function outreachGroups(list: HealthMember[], s: HealthSettings) {
  const active = list.filter((m) => !m.snoozedUntil);
  const groups = [
    { key: "fu", label: "Follow-up overdue", action: "Complete the pending action", test: (m: HealthMember) => m.followUpOverdue },
    { key: "newc", label: "New member check-in", action: "Welcome and understand their expectations", test: (m: HealthMember) => m.daysSinceContact === null && m.joinedDaysAgo <= s.newMemberDays },
    { key: "never", label: "Never contacted", action: "Initiate an introduction", test: (m: HealthMember) => m.daysSinceContact === null && m.joinedDaysAgo > s.newMemberDays },
    { key: "t3", label: `${s.thresholds.t3}+ days`, action: "Review relationship and re-engagement plan", test: (m: HealthMember) => (m.daysSinceContact ?? -1) > s.thresholds.t3 },
    { key: "t2", label: `${s.thresholds.t2}+ days`, action: "Prioritise a personal outreach", test: (m: HealthMember) => (m.daysSinceContact ?? -1) > s.thresholds.t2 },
    { key: "t1", label: `${s.thresholds.t1}+ days`, action: "Routine check-in", test: (m: HealthMember) => (m.daysSinceContact ?? -1) > s.thresholds.t1 },
  ];
  const taken = new Set<string>();
  return groups.map((g) => {
    const members = active
      .filter((m) => !taken.has(m.id) && g.test(m))
      .sort((a, b) => (b.daysSinceContact ?? 9999) - (a.daysSinceContact ?? 9999));
    members.forEach((m) => taken.add(m.id));
    return { ...g, members };
  });
}

/** Interaction counts by type, inside the view, over the last `days`. */
export function interactionsByType(interactions: Interaction[], list: HealthMember[], types: string[], days: number, asOf: string) {
  const ids = new Set(list.map((m) => m.id));
  const since = new Date(`${asOf}T00:00`);
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString().slice(0, 10);
  const recent = interactions.filter((x) => ids.has(x.memberId) && x.date >= sinceIso);
  return types.map((type) => ({ type, count: recent.filter((x) => x.type === type).length }));
}

export function groupCount(list: HealthMember[], key: (m: HealthMember) => string) {
  const counts = new Map<string, HealthMember[]>();
  list.forEach((m) => counts.set(key(m), [...(counts.get(key(m)) ?? []), m]));
  return [...counts.entries()]
    .map(([label, members]) => ({ label, members }))
    .sort((a, b) => b.members.length - a.members.length || a.label.localeCompare(b.label));
}

export const bySegment = {
  City: (m: HealthMember) => m.city,
  Startup: (m: HealthMember) => m.startup,
  Seniority: (m: HealthMember) => m.seniority,
  Experience: (m: HealthMember) => experienceBand(m.yearsOfExperience),
};

/** Months of joins, oldest first, for growth. */
export function monthlyJoins(list: HealthMember[], asOf: string, months = 7) {
  const end = new Date(`${asOf}T00:00`);
  return Array.from({ length: months }, (_, k) => {
    const d = new Date(end.getFullYear(), end.getMonth() - (months - 1 - k), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      members: list.filter((m) => m.joinedOn.startsWith(key)),
    };
  });
}

/** One row per owner for the side-by-side comparison. */
export function ownerRows(data: HealthData) {
  const scopes = ["", ...data.settings.owners, UNASSIGNED];
  return scopes.map((scope) => {
    const list = scopeMembers(data.members, scope);
    const s = data.settings;
    return {
      scope,
      label: scope ? scopeLabel(scope).replace("’s members", "") : "All members (combined)",
      members: list,
      recent: list.filter((m) => m.daysSinceContact !== null && m.daysSinceContact <= s.thresholds.t1),
      never: list.filter((m) => m.daysSinceContact === null),
      due: list.filter((m) => isFollowUpDue(m, s)),
      risk: list.filter((m) => isAtRisk(m, s)),
      reach: list.filter((m) => m.eventsAttended.length > 0),
      coverage: list.filter((m) => m.daysSinceContact !== null && m.daysSinceContact <= 90),
    };
  });
}

/** Data-quality checks (PRD §7) — each opens the members behind it. */
export const DATA_CHECKS: { key: string; label: string; test: (m: HealthMember) => boolean; field?: "linkedin" | "interests" | "hobbies" | "whatsapp" | "owner" }[] = [
  { key: "linkedin", label: "Missing LinkedIn", test: (m) => !m.linkedin, field: "linkedin" },
  { key: "interests", label: "Missing interests", test: (m) => m.interests.length === 0, field: "interests" },
  { key: "hobbies", label: "Missing hobbies", test: (m) => m.hobbies.length === 0, field: "hobbies" },
  { key: "whatsapp", label: "Missing WhatsApp number", test: (m) => !m.whatsapp, field: "whatsapp" },
  { key: "owner", label: "No relationship owner", test: (m) => !m.owner, field: "owner" },
  { key: "login", label: "Never logged in", test: (m) => !m.lastLoginAt },
];
