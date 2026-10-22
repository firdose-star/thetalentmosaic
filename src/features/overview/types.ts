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
    /** HR functions with at least one member — "Current Role" (spec §5.3). */
    hrFunctions: number;
    upcomingEvents: number;
    activeOpportunities: number;
  };
  seniority: { level: Seniority; count: number }[];
  cities: { city: string; count: number }[];
  experience: { band: ExperienceBand; count: number }[];
  /** Representation across HR roles. */
  hrFunctions: { name: string; count: number }[];
  startups: { name: string; count: number }[];
  /** Admin only (PRD §3): joins per month by approval date, oldest first. */
  monthlyJoins: { key: string; label: string; count: number }[];
  birthdays: { today: MemberCard[]; upcoming: UpcomingBirthday[] };
  /** Joined in the last 10 days, newest first. */
  recentMembers: MemberCard[];
  /** The next few upcoming events, soonest first. Members see city only. */
  nextEvents: {
    id: string;
    title: string;
    date: string;
    time?: string;
    city: string;
    format: string;
    category: string;
  }[];
  /** The freshest active job listings. */
  latestRoles: {
    id: string;
    title: string;
    company: string;
    location: string;
    postedDaysAgo: number | null;
  }[];
  /** Admin only: open items across the admin queues. */
  attention: {
    registrations: number;
    memberRequests: number;
    submissions: number;
    duplicates: number;
    dataIssues: number;
  };
}
