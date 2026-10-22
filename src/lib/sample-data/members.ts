/**
 * SAMPLE member records, ported from the clickable prototype's generator.
 *
 * Deterministic: the same 60 members every run, so screenshots and reviews
 * agree. Every metric on every page is computed from these records — never
 * typed in — exactly as the production API will compute them from MongoDB.
 * Delete this folder once the real member import (PRD §13, phase 1) lands.
 */
import type {
  CommunityEvent,
  HrFunction,
  Member,
  Seniority,
} from "@/types/community";
import { HR_FUNCTIONS } from "@/types/community";

import { addDays, isoDate, SAMPLE_AS_OF } from "./dates";
import { PAST_EVENTS } from "./events";

const FIRST = ["Ananya", "Rohan", "Priya", "Karthik", "Sneha", "Arjun", "Meera", "Imran", "Divya", "Vikram", "Tara", "Nikhil", "Aditi", "Sameer", "Kavya", "Rahul", "Pooja", "Aman", "Isha", "Varun"];
const LAST = ["Rao", "Mehta", "Nair", "Subramanian", "Kulkarni", "Malhotra", "Iyer", "Qureshi", "Reddy", "Sethi", "Bhatia", "Joshi"];
const CITIES = ["Bangalore", "Bangalore", "Bangalore", "Mumbai", "Mumbai", "Delhi NCR", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"];
const STARTUPS = ["Paybridge", "Nimbus Labs", "Kiranaly", "Gridwise", "Orbitly", "Zesto", "Tallyfox", "Loomstack", "Brightkart", "Fintrail", "LearnLoop", "Trackwise"];
const LEVEL_CYCLE: Seniority[] = ["Associate", "Manager", "Manager", "Head", "Associate", "Manager", "Director/VP", "Head", "Manager", "Associate", "CHRO", "Manager"];
const ASSOCIATE_TITLES = ["Recruiter", "HR Business Associate", "L&D Associate", "Comp & Ben Analyst", "People Ops Associate", "People Analyst", "Culture Associate", "HR Generalist"];
const INTERESTS = ["Employer branding", "Org design", "People analytics", "Compensation strategy", "Leadership development", "HR tech", "Inclusion & belonging", "Workplace culture", "Hiring strategy", "Employment law"];
const HOBBIES = ["Running", "Trekking", "Filter coffee", "Board games", "Photography", "Cooking", "Cricket", "Reading", "Travel", "Live music"];
const YEARS: Record<Seniority, [number, number]> = { Associate: [2, 5], Manager: [6, 10], Head: [11, 14], "Director/VP": [14, 18], CHRO: [17, 22] };
/** Members whose birthday falls within the next 10 days, so the panel is never empty. */
const BIRTHDAY_OFFSET: Record<number, number> = { 2: 0, 7: 0, 11: 0, 4: 2, 9: 4, 15: 7, 20: 9 };
const LAST_LOGIN_DAYS = [0, 0, 1, 1, 2, 3, 4, 6, 9, 12, 18, 26, 41, 63, 95];
const EVENT_COUNTS = [0, 0, 1, 1, 2, 3, 4, 5, 7, 9];
export const RELATIONSHIP_OWNERS = ["Shubham", "Ritushree", "Bhuvana"];

function designation(level: Seniority, fn: HrFunction, index: number, fnIndex: number) {
  switch (level) {
    case "Associate":
      return ASSOCIATE_TITLES[fnIndex];
    case "Manager":
      return `${fn} Manager`;
    case "Head":
      return `Head of ${fn}`;
    case "Director/VP":
      return `${index % 2 ? "VP" : "Director"}, ${fn}`;
    case "CHRO":
      return "CHRO";
  }
}

function eventsFor(joinedOn: string, index: number, past: CommunityEvent[]) {
  const pool = past
    .filter((event) => event.date >= joinedOn)
    .sort((a, b) => a.date.localeCompare(b.date));
  const count = Math.min(pool.length, EVENT_COUNTS[(index * 7 + 2) % 10]);
  const step = Math.max(1, Math.ceil(pool.length / Math.max(count, 1)));
  return pool
    .filter((_, q) => (q + index) % step === 0)
    .slice(0, count)
    .map((event) => event.id);
}

export const MEMBERS: Member[] = Array.from({ length: 60 }, (_, i) => {
  const first = FIRST[i % 20];
  const last = LAST[(7 * i + 3) % 12];
  const level = LEVEL_CYCLE[(i * 5 + 1) % 12];
  const fnIndex = (i * 3 + (i % 5)) % 8;
  const fn = HR_FUNCTIONS[fnIndex];
  const startup = STARTUPS[(i * 7 + 1) % 12];
  const [lo, hi] = YEARS[level];
  const joinedDaysAgo =
    i < 6 ? [0, 1, 3, 5, 6, 8][i] : i < 14 ? 14 + (i - 6) * 9 : 80 + (i - 14) * 6;
  const joinedOn = isoDate(addDays(SAMPLE_AS_OF, -joinedDaysAgo));
  const birthday = addDays(SAMPLE_AS_OF, BIRTHDAY_OFFSET[i] ?? 15 + ((i * 53) % 300));
  const loginDaysAgo = Math.min(joinedDaysAgo, LAST_LOGIN_DAYS[(i * 7 + 3) % 15]);
  const loginAt = addDays(SAMPLE_AS_OF, -loginDaysAgo);
  loginAt.setHours(8 + ((i * 5) % 13), (i * 17) % 60);
  // Today's sign-ins can't be later than right now.
  const rightNow = new Date();
  if (loginAt > rightNow) loginAt.setTime(rightNow.getTime() - (5 + ((i * 13) % 50)) * 60_000);

  return {
    id: `m${i + 1}`,
    name: `${first} ${last}`,
    designation: designation(level, fn, i, fnIndex),
    startup,
    city: CITIES[(i * 5 + 2) % 12],
    seniority: level,
    hrFunction: fn,
    yearsOfExperience: lo + ((i * 7) % (hi - lo + 1)),
    interests: i % 17 === 0 ? [] : [INTERESTS[(i * 3) % 10], INTERESTS[(i * 3 + 4) % 10]],
    hobbies: i % 13 === 0 ? [] : [HOBBIES[(i * 7) % 10], HOBBIES[(i * 7 + 3) % 10]],
    linkedin: i % 11 === 5 ? "" : `linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}`,
    email: `${first}.${last}@${startup.replace(/\s/g, "")}.example`.toLowerCase(),
    whatsapp: `90000${10001 + i}`,
    joinedOn,
    birthday: { month: birthday.getMonth(), day: birthday.getDate() },
    status: i % 19 === 18 ? "On break" : "Active",
    tags: i % 9 === 0 ? ["Community champion"] : i % 14 === 3 ? ["Speaker"] : [],
    eventsAttended: eventsFor(joinedOn, i, PAST_EVENTS),
    owner: RELATIONSHIP_OWNERS[i % 3],
    lastLoginAt: i % 23 === 22 ? null : loginAt.toISOString(),
    loginCount: i % 23 === 22 ? 0 : 1 + ((i * 7) % 12),
  };
});
