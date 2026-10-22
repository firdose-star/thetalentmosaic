/**
 * Overview API calls.
 *
 * Today the summary is computed from the SAMPLE dataset. When the MongoDB-backed
 * Route Handler exists, replace the body of `summary` with
 *   api.get<OverviewSummary>(ENDPOINTS.overview.summary)
 * and nothing else changes — the hook and every component read the same shape.
 */
import {
  CONTACT_REQUESTS,
  DATA_ISSUES,
  DUPLICATES,
  JOBS,
  MEMBERS,
  PROFILE_CHANGES,
  REGISTRATIONS,
  SAMPLE_AS_OF,
  SUBMISSIONS,
  UPCOMING_EVENTS,
  addDays,
  daysFrom,
  daysUntilBirthday,
  isoDate,
  parseIsoDate,
} from "@/lib/sample-data";
import {
  EXPERIENCE_BANDS,
  SENIORITY_LEVELS,
  experienceBand,
  type Member,
} from "@/types/community";

import type { MemberCard, OverviewSummary } from "../types";

const RECENT_DAYS = 10;
const BIRTHDAY_WINDOW_DAYS = 10;
const MONTHS_SHOWN = 7;

const toCard = (m: Member): MemberCard => ({
  id: m.id,
  name: m.name,
  designation: m.designation,
  startup: m.startup,
  city: m.city,
  joinedOn: m.joinedOn,
});

function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function buildSummary(asOf: Date): OverviewSummary {
  // PRD §9: only approved members count — every sample member is approved.
  const members = MEMBERS;

  const monthlyJoins = Array.from({ length: MONTHS_SHOWN }, (_, k) => {
    const month = new Date(asOf.getFullYear(), asOf.getMonth() - (MONTHS_SHOWN - 1 - k), 1);
    const key = isoDate(month).slice(0, 7);
    return {
      key,
      label: month.toLocaleDateString("en-IN", { month: "short" }),
      count: members.filter((m) => m.joinedOn.startsWith(key)).length,
    };
  });

  const birthdays = members
    .map((m) => ({ m, inDays: daysUntilBirthday(m.birthday, asOf) }))
    .filter(({ inDays }) => inDays <= BIRTHDAY_WINDOW_DAYS)
    .sort((a, b) => a.inDays - b.inDays);

  const seniority = SENIORITY_LEVELS.map((level) => ({
    level,
    count: members.filter((m) => m.seniority === level).length,
  })).filter((s) => s.count > 0);

  const cities = countBy(members, (m) => m.city).map(([city, count]) => ({ city, count }));

  return {
    asOf: isoDate(asOf),
    totals: {
      members: members.length,
      startups: new Set(members.map((m) => m.startup)).size,
      cities: cities.length,
      seniorityLevels: seniority.length,
      hrFunctions: new Set(members.map((m) => m.hrFunction)).size,
      upcomingEvents: UPCOMING_EVENTS.filter((e) => daysFrom(e.date, asOf) >= 0).length,
      activeOpportunities: JOBS.filter((j) => j.status === "active").length,
    },
    seniority,
    cities,
    hrFunctions: countBy(members, (m) => m.hrFunction).map(([name, count]) => ({ name, count })),
    startups: countBy(members, (m) => m.startup).map(([name, count]) => ({ name, count })),
    experience: EXPERIENCE_BANDS.map((band) => ({
      band,
      count: members.filter((m) => experienceBand(m.yearsOfExperience) === band).length,
    })),
    monthlyJoins,
    birthdays: {
      today: birthdays.filter((b) => b.inDays === 0).map(({ m }) => toCard(m)),
      upcoming: birthdays
        .filter((b) => b.inDays > 0)
        .map(({ m, inDays }) => ({
          ...toCard(m),
          inDays,
          date: isoDate(addDays(asOf, inDays)),
        })),
    },
    recentMembers: members
      .filter((m) => -daysFrom(m.joinedOn, asOf) <= RECENT_DAYS)
      .sort((a, b) => parseIsoDate(b.joinedOn).getTime() - parseIsoDate(a.joinedOn).getTime())
      .map(toCard),
    nextEvents: UPCOMING_EVENTS.filter((e) => daysFrom(e.date, asOf) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
      .map(({ id, title, date, time, city, format, category }) => ({
        id,
        title,
        date,
        time,
        city,
        format,
        category,
      })),
    latestRoles: JOBS.filter((j) => j.status === "active")
      .sort((a, b) => (a.postedDaysAgo ?? 999) - (b.postedDaysAgo ?? 999))
      .slice(0, 4)
      .map(({ id, title, company, location, postedDaysAgo }) => ({
        id,
        title,
        company,
        location,
        postedDaysAgo,
      })),
    attention: {
      registrations: REGISTRATIONS.length,
      memberRequests: PROFILE_CHANGES.length + CONTACT_REQUESTS.length,
      submissions: SUBMISSIONS.length,
      duplicates: DUPLICATES.length,
      dataIssues: DATA_ISSUES.length,
    },
  };
}

export const overviewService = {
  summary: async (): Promise<OverviewSummary> => buildSummary(SAMPLE_AS_OF),
};
