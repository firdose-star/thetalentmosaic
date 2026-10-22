/**
 * People directory API calls (spec §6).
 *
 * Computed from the SAMPLE dataset for now; each method maps to one future
 * endpoint (`GET /members`, `GET /members/:id`, `POST /members/:id/contact-requests`).
 * The API must apply the same rule as here: contact details and admin fields
 * are only ever sent to admins.
 */
import { MEMBERS } from "@/lib/sample-data";
import { experienceBand, type Member } from "@/types/community";
import type { Role } from "@/types/enums";

import type {
  DirectoryMember,
  FilterOptions,
  MemberProfile,
  MemberRecord,
  PeopleFilters,
} from "../types";

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

function missingData(m: Member) {
  const missing: string[] = [];
  if (!m.linkedin) missing.push("LinkedIn");
  if (m.interests.length === 0) missing.push("Interests");
  if (m.hobbies.length === 0) missing.push("Hobbies");
  if (!m.owner) missing.push("Owner");
  if (!m.lastLoginAt) missing.push("Never logged in");
  return missing;
}

function matches(m: Member, f: PeopleFilters) {
  const q = f.q.trim().toLowerCase();
  return (
    (!q || `${m.name} ${m.startup} ${m.designation} ${m.city}`.toLowerCase().includes(q)) &&
    (!f.city || m.city === f.city) &&
    (!f.seniority || m.seniority === f.seniority) &&
    (!f.startup || m.startup === f.startup) &&
    (!f.experience || experienceBand(m.yearsOfExperience) === f.experience) &&
    (!f.hobby || m.hobbies.some((h) => h.toLowerCase() === f.hobby.toLowerCase()))
  );
}

const toCard = (m: Member): DirectoryMember => ({
  id: m.id,
  name: m.name,
  startup: m.startup,
  designation: m.designation,
  city: m.city,
  joinedOn: m.joinedOn,
});

export const peopleService = {
  /** Alphabetical by default (spec §6.3). */
  list: async (filters: PeopleFilters): Promise<DirectoryMember[]> =>
    MEMBERS.filter((m) => matches(m, filters))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(toCard),

  /** Admin only: every record with status, owner and data gaps. */
  records: async (filters: PeopleFilters): Promise<MemberRecord[]> =>
    MEMBERS.filter((m) => matches(m, filters))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => ({
        ...toCard(m),
        status: m.status,
        joinedOn: m.joinedOn,
        owner: m.owner,
        missing: missingData(m),
      })),

  options: async (): Promise<FilterOptions> => ({
    cities: unique(MEMBERS.map((m) => m.city)),
    startups: unique(MEMBERS.map((m) => m.startup)),
    interests: unique(MEMBERS.flatMap((m) => m.interests)),
    // Hobby options are the keywords members typed into their profiles.
    hobbies: unique(MEMBERS.flatMap((m) => m.hobbies.map((h) => h.trim())).filter(Boolean)),
  }),

  detail: async (id: string, role: Role): Promise<MemberProfile | null> => {
    const m = MEMBERS.find((member) => member.id === id);
    if (!m) return null;
    const isAdmin = role === "admin";

    return {
      id: m.id,
      name: m.name,
      designation: m.designation,
      startup: m.startup,
      city: m.city,
      seniority: m.seniority,
      hrFunction: m.hrFunction,
      yearsOfExperience: m.yearsOfExperience,
      interests: m.interests,
      hobbies: m.hobbies,
      linkedin: m.linkedin,
      joinedOn: m.joinedOn,
      tags: m.tags,
      eventsAttended: m.eventsAttended.length,
      contact: isAdmin ? { email: m.email, whatsapp: `+91 ${m.whatsapp}` } : null,
      admin: isAdmin
        ? {
            status: m.status,
            owner: m.owner,
            missing: missingData(m),
            lastLoginAt: m.lastLoginAt,
            history: [
              { date: m.joinedOn, by: "System", change: "Registration approved and profile created" },
            ],
          }
        : null,
    };
  },

  /** A member asks the admins for someone's contact details (spec §6.5). */
  requestContact: async (memberId: string): Promise<{ memberId: string }> => ({ memberId }),
};
