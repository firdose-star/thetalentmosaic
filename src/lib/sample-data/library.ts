/**
 * SAMPLE Library content (PRD §7): vendors, HR resources and member
 * recommendations, ported from the prototype.
 */
export const VENDOR_CATEGORIES = [
  "Food & Catering",
  "Gifting",
  "Stationery & Printing",
  "Hotels & Stays",
  "Events & Experiences",
  "Venues",
  "Other",
];

export interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string;
  /** City or cities served, e.g. "Bangalore, Mumbai" or "Pan-India". */
  city: string;
  /** Exact area, when the vendor has a physical location. */
  area: string;
  website: string;
  instagram: string;
  /** 10-digit Indian mobile; also their WhatsApp. */
  phone: string;
  email: string;
  note: string;
}

export const VENDORS: Vendor[] = [
  { id: "v1", name: "Spice Route Caterers", category: "Food & Catering", description: "Team lunches, offsite menus and festive catering with solid vegetarian and vegan options.", city: "Bangalore, Mumbai", area: "Indiranagar, Bangalore · Bandra, Mumbai", website: "spiceroute.example", instagram: "spiceroute.eats", phone: "9000000001", email: "hello@spiceroute.example", note: "Minimum 25 plates. Vegan menu on request." },
  { id: "v2", name: "Tiffin & Co.", category: "Food & Catering", description: "Daily office meals and snack boxes for small teams.", city: "Pune, Hyderabad", area: "Koregaon Park, Pune · Madhapur, Hyderabad", website: "tiffinco.example", instagram: "tiffinco.daily", phone: "9000000002", email: "orders@tiffinco.example", note: "Monthly plans with a free trial week." },
  { id: "v3", name: "Giftwise Studio", category: "Gifting", description: "Joining kits, work anniversary gifts and festive hampers, with custom packaging.", city: "Pan-India delivery", area: "Studio in Jayanagar, Bangalore", website: "giftwise.example", instagram: "giftwise.studio", phone: "9000000003", email: "team@giftwise.example", note: "Orders of 50+ get custom branding at no extra cost." },
  { id: "v4", name: "Paper Trail Print", category: "Stationery & Printing", description: "Branded notebooks, welcome kits, badges and event collateral.", city: "Bangalore, Delhi NCR", area: "Peenya, Bangalore · Okhla, Delhi", website: "papertrail.example", instagram: "papertrail.print", phone: "9000000004", email: "print@papertrail.example", note: "Five-day turnaround for most orders." },
  { id: "v5", name: "The Greenroom Stays", category: "Hotels & Stays", description: "Offsite-friendly resorts with meeting rooms and group rates.", city: "Coorg, Goa, Lonavala", area: "Properties in Coorg, Goa and Lonavala", website: "greenroom.example", instagram: "thegreenroom.stays", phone: "9000000005", email: "groups@greenroom.example", note: "Group rates from 15 rooms." },
  { id: "v6", name: "Wander Offsites", category: "Events & Experiences", description: "Planned team offsites, trail days and wellness retreats.", city: "Pan-India", area: "Based in Bangalore, travels across India", website: "wanderoffsites.example", instagram: "wander.offsites", phone: "9000000006", email: "plan@wanderoffsites.example", note: "Handles travel, stay and activities end to end." },
  { id: "v7", name: "Playbox Experiences", category: "Events & Experiences", description: "Quiz nights, game days and hackathon hosting for 20 to 200 people.", city: "Bangalore, Mumbai", area: "Whitefield, Bangalore · Powai, Mumbai", website: "playbox.example", instagram: "playbox.live", phone: "9000000007", email: "hello@playbox.example", note: "Hosts many of our own community catchups." },
  { id: "v8", name: "Atrium Venues", category: "Venues", description: "Meeting and event spaces for 20 to 300 people with AV included.", city: "Mumbai, Gurgaon", area: "Lower Parel, Mumbai · Cyber Hub, Gurgaon", website: "atriumvenues.example", instagram: "atrium.venues", phone: "9000000008", email: "bookings@atriumvenues.example", note: "AV and projector included in every booking." },
  { id: "v9", name: "The Loft Collective", category: "Venues", description: "Casual, well-lit spaces for community meetups of up to 80.", city: "Bangalore, Pune", area: "Indiranagar, Bangalore · Koregaon Park, Pune", website: "loftcollective.example", instagram: "theloft.collective", phone: "9000000009", email: "space@loftcollective.example", note: "Evening slots are the most popular, so book early." },
  { id: "v10", name: "ClearPath Immigration", category: "Other", description: "Visa and relocation support for cross-border hires.", city: "Pan-India", area: "Remote, serves clients across India", website: "clearpath.example", instagram: "", phone: "9000000010", email: "help@clearpath.example", note: "Free 30-minute consult for community members." },
];

export const RESOURCE_CATEGORIES = [
  "HR templates",
  "Policies and frameworks",
  "Guides and playbooks",
  "Useful tools",
  "Research and articles",
  "Event presentations and learning materials",
];

export type AccessLevel = "All members" | "Verified members" | "Admins";

export interface Resource {
  id: string;
  title: string;
  category: string;
  description: string;
  source: string;
  addedOn: string;
  access: AccessLevel;
}

export const RESOURCES: Resource[] = [
  { id: "res1", title: "Offer letter and negotiation toolkit", category: "HR templates", description: "Eight editable offer letters, a counter-offer script and a decline template.", source: "Contributed by Vikram Sethi", addedOn: "2026-10-02", access: "All members" },
  { id: "res2", title: "Startup compensation bands, 2026", category: "Research and articles", description: "Salary and ESOP ranges for companies of 0 to 100 people across six cities.", source: "Community survey", addedOn: "2026-09-28", access: "Verified members" },
  { id: "res3", title: "90-day onboarding playbook", category: "Guides and playbooks", description: "A week-by-week plan with manager checklists and a buddy programme outline.", source: "Contributed by Ananya Rao", addedOn: "2026-09-14", access: "All members" },
  { id: "res4", title: "POSH policy starter pack", category: "Policies and frameworks", description: "Policy text, ICC constitution notes and an annual report format.", source: "Contributed by Nikhil Joshi", addedOn: "2026-09-02", access: "All members" },
  { id: "res5", title: "Structured interview scorecards", category: "HR templates", description: "Role-specific scorecards for 12 common startup roles.", source: "Contributed by Rohan Mehta", addedOn: "2026-08-21", access: "All members" },
  { id: "res6", title: "Attrition analysis workbook", category: "Useful tools", description: "A sheet that turns exit data into regretted-attrition views.", source: "Contributed by Imran Qureshi", addedOn: "2026-08-09", access: "All members" },
  { id: "res7", title: "Culture at 50 people: panel slides", category: "Event presentations and learning materials", description: "Slides and notes from the September catchup panel.", source: "Catchup, 26 Sep 2026", addedOn: "2026-09-30", access: "Verified members" },
  { id: "res8", title: "Community moderation guidelines", category: "Policies and frameworks", description: "How admins review submissions and handle member requests.", source: "Talent Mosaic team", addedOn: "2026-07-11", access: "Admins" },
];

export type RecommendationStatus = "Under review" | "Published";

export interface Recommendation {
  id: string;
  title: string;
  owner: string;
  description: string;
  status: RecommendationStatus;
  submittedOn: string;
  /** Name of an uploaded file, when the member attached one. */
  fileName?: string;
  link?: string;
}

export const RECOMMENDATIONS: Recommendation[] = [
  { id: "rec1", title: "Exit interview question bank", owner: "Meera Iyer", description: "Thirty questions grouped by theme, with a note on how to read patterns.", status: "Under review", submittedOn: "2026-10-15" },
  { id: "rec2", title: "Manager one-on-one template", owner: "Aditi Joshi", description: "A one-page template for weekly one-on-ones with a growth section.", status: "Published", submittedOn: "2026-10-12" },
  { id: "rec3", title: "Interview panel training deck", owner: "Sneha Kulkarni", description: "A 20-slide deck for calibrating panels before a hiring sprint.", status: "Published", submittedOn: "2026-10-08" },
  { id: "rec4", title: "Remote onboarding checklist", owner: "Karthik Subramanian", description: "Day-zero to day-thirty checklist for teams that never meet in person.", status: "Published", submittedOn: "2026-10-05" },
  { id: "rec5", title: "Notice period buyout calculator", owner: "Vikram Sethi", description: "A sheet that works out the cost of a buyout so you can decide quickly.", status: "Published", submittedOn: "2026-09-30" },
];
