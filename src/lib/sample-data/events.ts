/**
 * SAMPLE events, ported from the prototype. Upcoming events carry the full
 * venue (admins only) and capacity; past events carry attendance, photos and
 * tagged winners.
 */
import type { CommunityEvent } from "@/types/community";

export const UPCOMING_EVENTS: CommunityEvent[] = [
  { id: "e1", title: "HR Leaders Roundtable", date: "2026-10-17", time: "6:30 PM", format: "In person", venue: "The Loft Collective, Indiranagar, Bangalore", city: "Bangalore", category: "Roundtable", description: "An evening with ten HR leaders on how they run performance conversations in teams under 200. Dinner included.", registered: 46, capacity: 60 },
  { id: "e2", title: "Hiring in the AI Era: Workshop", date: "2026-10-20", time: "4:00 PM", format: "Online", venue: "Online, link shared after registration", city: "Online", category: "Workshop", description: "A hands-on session on screening, interviewing and assessing candidates when everyone has an AI assistant.", registered: 188, capacity: 250 },
  { id: "e3", title: "Comp and Ben Benchmarks Webinar", date: "2026-10-22", time: "5:00 PM", format: "Online", venue: "Online, link shared after registration", city: "Online", category: "Webinar", description: "Walk through the 2026 community compensation survey and ask the contributors your questions.", registered: 141, capacity: 250 },
  { id: "e4", title: "Founders x People Leaders Mixer", date: "2026-10-29", time: "7:00 PM", format: "In person", venue: "Atrium Venues, Lower Parel, Mumbai", city: "Mumbai", category: "Mixer", description: "An informal evening where founders and people leaders swap notes. Games, snacks and a quiz with prizes.", registered: 72, capacity: 80 },
  { id: "e5", title: "Talent Mosaic Annual Summit", date: "2026-11-07", time: "10:00 AM", format: "In person", venue: "Atrium Hall, Cyber Hub, Gurgaon", city: "Gurgaon", category: "Summit", description: "A full day of talks, workshops and the community awards. Our biggest catchup of the year.", registered: 305, capacity: 400 },
  { id: "e6", title: "People Analytics Clinic", date: "2026-11-14", time: "11:00 AM", format: "Hybrid", venue: "The Loft Collective, Indiranagar, Bangalore, and online", city: "Bangalore", category: "Workshop", description: "Bring a messy people dataset and leave with a plan. Small groups, hands-on.", registered: 24, capacity: 40 },
  { id: "e7", title: "Hiring Metrics Jam", date: "2026-11-21", time: "11:00 AM", format: "In person", venue: "Brewhouse Cafe, Indiranagar, Bangalore", city: "Bangalore", category: "Community session", description: "A relaxed morning swapping the hiring metrics we track, the ones we ignore and the dashboards we are embarrassed by.", hostedBy: "Karthik Subramanian", registrationUrl: "https://register.example/hiring-metrics-jam", cost: "Free" },
];

const winner = (text: string) => {
  if (text === "Not applicable") return [];
  const [prize, ...rest] = text.split(": ");
  return [{ prize, winner: rest.join(": ") }];
};

export const PAST_EVENTS: CommunityEvent[] = [
  { id: "p115", title: "Culture at 50 People: Panel", date: "2026-09-26", format: "In person", city: "Bangalore", category: "Roundtable", description: "Four founders and people leaders on keeping culture intact from 30 to 80 people.", photos: 42, attended: 58, winners: winner("Best question of the night: Meera Sethi") },
  { id: "p114", title: "Monsoon HR Meetup", date: "2026-08-29", format: "In person", city: "Mumbai", category: "Mixer", description: "A relaxed Saturday meetup with a rapid-fire quiz and a book swap.", photos: 31, attended: 37, winners: winner("Quiz night: Team Zesto") },
  { id: "p113", title: "ATS Vendor Showcase", date: "2026-08-08", format: "Hybrid", city: "Gurgaon", category: "Workshop", description: "Five applicant tracking vendors, demoed live against the same hiring scenario.", photos: 18, attended: 64, winners: winner("Crowd favourite demo: Hirely") },
  { id: "p112", title: "Offsite Ideas Jam", date: "2026-07-18", format: "In person", city: "Bangalore", category: "Workshop", description: "Teams pitched offsite plans in ten minutes. Vendors were on hand to price them live.", photos: 36, attended: 52, winners: winner("Best offsite plan: Team Nimbus Labs") },
  { id: "p111", title: "HR x Founders Breakfast", date: "2026-06-27", format: "In person", city: "Gurgaon", category: "Roundtable", description: "A slow Saturday breakfast where founders told HR leaders what they actually need.", photos: 22, attended: 34, winners: [] },
  { id: "p110", title: "Comp and ESOP Deep Dive", date: "2026-05-30", format: "In person", city: "Mumbai", category: "Workshop", description: "A hands-on look at equity design, vesting and communicating ESOPs to teams.", photos: 27, attended: 46, winners: winner("Best case study: Team Paybridge") },
  { id: "p109", title: "Summer Quiz Night", date: "2026-04-25", format: "In person", city: "Bangalore", category: "Mixer", description: "Seven rounds of HR trivia, pop culture and a very competitive picture round.", photos: 64, attended: 71, winners: winner("Quiz night: Team Gridwise") },
  { id: "p108", title: "Spring Reset: Wellbeing at Work", date: "2026-03-21", format: "In person", city: "Gurgaon", category: "Roundtable", description: "What actually works for wellbeing in a startup, and what is just a poster on a wall.", photos: 20, attended: 39, winners: [] },
  { id: "p107", title: "Love Your Team: Valentine’s Edition", date: "2026-02-14", format: "In person", city: "Mumbai", category: "Mixer", description: "A cosy evening of games, appreciation cards and chocolate.", photos: 48, attended: 55, winners: winner("Best appreciation card: Divya Iyer") },
  { id: "p106", title: "New Year People Planning", date: "2026-01-24", format: "In person", city: "Bangalore", category: "Workshop", description: "Planning the people agenda for the year ahead, one honest page at a time.", photos: 25, attended: 61, winners: [] },
  { id: "p105", title: "Winter Catchup", date: "2025-12-13", format: "In person", city: "Mumbai", category: "Mixer", description: "Year-end dinner with games, gifts and a community quiz.", photos: 56, attended: 81, winners: winner("Quiz night: Team Gridwise") },
  { id: "p104", title: "Talent Mosaic Annual Summit 2025", date: "2025-11-08", format: "In person", city: "Bangalore", category: "Summit", description: "A full day of talks and workshops on building people functions in startups.", photos: 120, attended: 236, winners: winner("Best people story: Kiranaly") },
  { id: "p103", title: "Diwali Dinner", date: "2025-10-18", format: "In person", city: "Gurgaon", category: "Mixer", description: "Lights, sweets and a long table of people who understand each other’s week.", photos: 44, attended: 48, winners: winner("Best dressed: Team Orbitly") },
  { id: "p102", title: "Offsite Planning Workshop", date: "2025-09-20", format: "Hybrid", city: "Mumbai", category: "Workshop", description: "Planning offsites that people actually enjoy, with vendors on hand.", photos: 24, attended: 49, winners: winner("Best offsite plan: Team Tallyfox") },
  { id: "p101", title: "The First Catchup", date: "2025-08-30", format: "In person", city: "Bangalore", category: "Mixer", description: "Where it all began. A small room, a lot of coffee and the first twenty members.", photos: 30, attended: 22, winners: [] },
];
