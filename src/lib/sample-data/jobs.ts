/**
 * SAMPLE job listings, as the job-scraping feed would deliver them (PRD §6.4,
 * spec §8). Only `active` listings count towards Overview and Opportunities;
 * expired and in-review listings are admin-only.
 */
import type { HrFunction, JobListing } from "@/types/community";

type Raw = Omit<JobListing, "url" | "lastCheckedDaysAgo" | "description" | "skills">;

const RAW: Raw[] = [
  { id: "j1", title: "Head of Talent Acquisition", company: "Kiranaly", location: "Bangalore", hrFunction: "Talent Acquisition", seniority: "Head / Director / VP", arrangement: "Hybrid", type: "Full-time", postedDaysAgo: 1, source: "LinkedIn", salary: "₹38–48 LPA", status: "active", experience: "8+ years in hiring, 3+ years leading a team" },
  { id: "j2", title: "People Operations Manager", company: "Paybridge", location: "Mumbai", hrFunction: "People Operations", seniority: "Manager", arrangement: "Hybrid", type: "Full-time", postedDaysAgo: 2, source: "Company careers page", salary: "", status: "active", experience: "5+ years in people operations" },
  { id: "j3", title: "Senior HR Business Partner", company: "Gridwise", location: "Chennai", hrFunction: "HR Business Partnering", seniority: "Manager", arrangement: "On-site", type: "Full-time", postedDaysAgo: 2, source: "Company careers page", salary: "₹24–30 LPA", status: "active", experience: "6+ years in HRBP roles" },
  { id: "j4", title: "Talent Partner, Engineering", company: "Nimbus Labs", location: "Remote, India", hrFunction: "Talent Acquisition", seniority: "Associate", arrangement: "Remote", type: "Full-time", postedDaysAgo: 3, source: "LinkedIn", salary: "", status: "active", experience: "2 to 4 years in tech hiring" },
  { id: "j5", title: "Compensation and Benefits Lead", company: "Zesto", location: "Delhi NCR", hrFunction: "Compensation & Benefits", seniority: "Manager", arrangement: "Hybrid", type: "Full-time", postedDaysAgo: 4, source: "LinkedIn", salary: "₹28–36 LPA", status: "active", experience: "7+ years in compensation" },
  { id: "j6", title: "VP, People and Culture", company: "Orbitly", location: "Pune", hrFunction: "Culture & Engagement", seniority: "Head / Director / VP", arrangement: "On-site", type: "Full-time", postedDaysAgo: 5, source: "Wellfound", salary: "", status: "active", experience: "14+ years, with 4+ in a leadership role" },
  { id: "j7", title: "L&D Specialist", company: "Tallyfox", location: "Hyderabad", hrFunction: "Learning & Development", seniority: "Associate", arrangement: "Hybrid", type: "Contract", postedDaysAgo: 6, source: "Company careers page", salary: "", status: "active", experience: "2 to 5 years in L&D" },
  { id: "j8", title: "HR Generalist", company: "Loomstack", location: "Bangalore", hrFunction: "Generalist HR", seniority: "Associate", arrangement: "On-site", type: "Full-time", postedDaysAgo: 7, source: "LinkedIn", salary: "₹9–12 LPA", status: "active", experience: "2 to 4 years as a generalist" },
  { id: "j9", title: "Chief People Officer", company: "Brightkart", location: "Bangalore", hrFunction: "Generalist HR", seniority: "SVP / CXO", arrangement: "Hybrid", type: "Full-time", postedDaysAgo: 9, source: "LinkedIn", salary: "", status: "active", experience: "18+ years, with experience scaling a team past 500" },
  { id: "j10", title: "People Analytics Lead", company: "Fintrail", location: "Mumbai", hrFunction: "People Analytics", seniority: "Head / Director / VP", arrangement: "Hybrid", type: "Full-time", postedDaysAgo: 11, source: "Wellfound", salary: "₹32–40 LPA", status: "active", experience: "8+ years in people analytics" },
  { id: "j11", title: "Recruiter, Sales Hiring", company: "Zesto", location: "Remote, India", hrFunction: "Talent Acquisition", seniority: "Associate", arrangement: "Remote", type: "Internship", postedDaysAgo: null, source: "Company careers page", salary: "", status: "active", experience: "0 to 2 years" },
  { id: "j12", title: "Culture Associate", company: "LearnLoop", location: "Chennai", hrFunction: "Culture & Engagement", seniority: "Associate", arrangement: "On-site", type: "Full-time", postedDaysAgo: 12, source: "LinkedIn", salary: "", status: "active", experience: "1 to 3 years" },
  { id: "j13", title: "HR Manager", company: "Trackwise", location: "Kolkata", hrFunction: "Generalist HR", seniority: "Manager", arrangement: "On-site", type: "Full-time", postedDaysAgo: 30, source: "LinkedIn", salary: "", status: "expired", experience: "6+ years" },
  { id: "j14", title: "Senior Recruiter", company: "Nimbus Labs", location: "Pune", hrFunction: "Talent Acquisition", seniority: "Manager", arrangement: "Hybrid", type: "Full-time", postedDaysAgo: 2, source: "Wellfound", salary: "", status: "review", experience: "5+ years" },
];

const DESCRIPTIONS: Record<HrFunction, string> = {
  "Talent Acquisition": "Own hiring across the company, from sourcing and interviews to offers, working closely with founders and hiring managers.",
  "HR Business Partnering": "Partner with leaders on org design, performance and people decisions, and coach managers through them.",
  "Learning & Development": "Build learning programmes for managers and teams, and measure how well they work.",
  "Compensation & Benefits": "Design and run compensation cycles, benefits and equity programmes for a fast-growing team.",
  "People Operations": "Run the people operations stack: onboarding, HRIS, policies and compliance.",
  "People Analytics": "Turn people data into decisions on hiring, attrition and engagement.",
  "Culture & Engagement": "Shape culture rituals, engagement listening and internal communications.",
  "Generalist HR": "Run the full employee lifecycle for a growing team, from hiring to exits.",
};

const SKILLS: Record<HrFunction, string[]> = {
  "Talent Acquisition": ["Full-cycle hiring", "Stakeholder management", "Employer branding"],
  "HR Business Partnering": ["Org design", "Coaching", "Performance management"],
  "Learning & Development": ["Programme design", "Facilitation", "Learning analytics"],
  "Compensation & Benefits": ["Benchmarking", "Equity plans", "Excel or Sheets modelling"],
  "People Operations": ["HRIS", "Compliance", "Process design"],
  "People Analytics": ["SQL or Sheets", "Dashboards", "Survey design"],
  "Culture & Engagement": ["Engagement surveys", "Communications", "Event design"],
  "Generalist HR": ["Employee relations", "Policy", "Onboarding"],
};

export const JOBS: JobListing[] = RAW.map((job, i) => ({
  ...job,
  url: `https://jobs.example/${job.company.toLowerCase().replace(/\s/g, "-")}/${job.id}`,
  lastCheckedDaysAgo: job.status === "expired" ? 3 : i % 3,
  description: DESCRIPTIONS[job.hrFunction],
  skills: SKILLS[job.hrFunction],
}));

/** Admin view of the scraper (spec §8.8). */
export const SCRAPER_STATUS = {
  lastSuccessfulRun: "Today, 09:30",
  sources: [
    { name: "LinkedIn", status: "ok" as const, listings: 6 },
    { name: "Company careers page", status: "warning" as const, listings: 4 },
    { name: "Wellfound", status: "ok" as const, listings: 3 },
  ],
  brokenLinks: [
    { jobId: "j11", title: "Recruiter, Sales Hiring", company: "Zesto", reason: "Application link returns 404" },
    { jobId: "j13", title: "HR Manager", company: "Trackwise", reason: "Listing removed by company" },
  ],
  duplicates: [
    { title: "Senior Recruiter", company: "Nimbus Labs", sources: ["Wellfound", "LinkedIn"] },
  ],
  errors: [
    { at: "09:12", source: "Company careers page", message: "Careers page layout changed for Loomstack. 0 listings parsed." },
    { at: "08:40", source: "LinkedIn", message: "Rate limited by a job board. Retry is scheduled in 30 minutes." },
  ],
};
