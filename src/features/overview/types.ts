/**
 * The Overview page's single aggregate (PRD §6.1). One summary response feeds
 * every panel — never fetch rows and reduce them in the browser.
 */
import type { ExperienceBand, Seniority } from "@/types/community";

export interface MemberCard {
  id: string;
  name: string;
  designation: string;
  startup: string;
  city: string;
  joinedOn: string;
}

export interface UpcomingBirthday extends MemberCard {
  /** 0 = today. */
  inDays: number;
  date: string;
}

export interface OverviewSummary {
  /** The date every relative figure is computed against. */
  asOf: string;
  totals: {
    members: number;
    startups: number;
    cities: number;
    seniorityLevels: number;
  };
  seniority: { level: Seniority; count: number }[];
  cities: { city: string; count: number }[];
  experience: { band: ExperienceBand; count: number }[];
  /** Admin only (PRD §3): joins per month by approval date, oldest first. */
  monthlyJoins: { key: string; label: string; count: number }[];
  birthdays: { today: MemberCard[]; upcoming: UpcomingBirthday[] };
  /** Members who joined us recently (last 10 days), newest first. */
  recentMembers: MemberCard[];
  /** Admin only: open items across the admin queues. */
  attention: {
    registrations: number;
    memberRequests: number;
    submissions: number;
    duplicates: number;
    dataIssues: number;
  };
}
