import type { HrFunction, MemberStatus, Seniority } from "@/types/community";

export const PEOPLE_FILTER_KEYS = [
  "q",
  "city",
  "seniority",
  "startup",
  "experience",
  "hobby",
] as const;

export type PeopleFilterKey = (typeof PEOPLE_FILTER_KEYS)[number];
export type PeopleFilters = Record<PeopleFilterKey, string>;

/** Directory card (spec §6.3): name and startup, plus what the card needs to render. */
export interface DirectoryMember {
  id: string;
  name: string;
  startup: string;
  designation: string;
  city: string;
  /** Joining date — drives the live "Mosaic Member since" label. */
  joinedOn: string;
}

export interface FilterOptions {
  cities: string[];
  startups: string[];
  hobbies: string[];
}

export interface MemberProfile {
  id: string;
  name: string;
  designation: string;
  startup: string;
  city: string;
  seniority: Seniority;
  hrFunction: HrFunction | null;
  yearsOfExperience: number | null;
  hobbies: string[];
  linkedin: string;
  joinedOn: string;
  tags: string[];
  eventsAttended: number;
  /** Admin only (spec §6.3) — null for members. */
  contact: { email: string; whatsapp: string } | null;
  /** Admin only (spec §6.6) — null for members. */
  admin: {
    status: MemberStatus;
    owner: string | null;
    /** e.g. "20 Aug · in 12 days"; null when not shared. */
    birthday: string | null;
    missing: string[];
    lastLoginAt: string | null;
    history: { date: string; by: string; change: string }[];
  } | null;
}

/** Admin "member records" table row (spec §6.6). */
export interface MemberRecord extends DirectoryMember {
  status: MemberStatus;
  joinedOn: string;
  owner: string | null;
  missing: string[];
}
