/**
 * SAMPLE admin work queues (PRD §7): registrations, submissions, profile
 * change requests, contact requests, duplicate candidates and data issues.
 * The Overview's "needs attention" row counts these.
 */
export interface Registration {
  id: string;
  name: string;
  email: string;
  startup: string;
  city: string;
  designation: string;
  receivedAt: string;
  /** Whether the email domain matches a known startup. */
  verifiedDomain: boolean;
}

export const REGISTRATIONS: Registration[] = [
  { id: "r1", name: "Harsh Vora", email: "harsh.vora@fintrail.example", startup: "Fintrail", city: "Mumbai", designation: "Talent Acquisition Lead", receivedAt: "Today", verifiedDomain: true },
  { id: "r2", name: "Lakshmi Pillai", email: "lakshmi@learnloop.example", startup: "LearnLoop", city: "Chennai", designation: "HR Manager", receivedAt: "Today", verifiedDomain: true },
  { id: "r3", name: "Gaurav Singh", email: "gaurav.s@gmail.example", startup: "Not listed", city: "Delhi NCR", designation: "Recruiter", receivedAt: "Yesterday", verifiedDomain: false },
  { id: "r4", name: "Neha Chawla", email: "neha.c@brightkart.example", startup: "Brightkart", city: "Hyderabad", designation: "Head of People", receivedAt: "2 days ago", verifiedDomain: true },
  { id: "r5", name: "Farhan Ali", email: "farhan@trackwise.example", startup: "Trackwise", city: "Bangalore", designation: "People Ops Associate", receivedAt: "3 days ago", verifiedDomain: false },
];

export interface Submission {
  id: string;
  kind: "Vendor" | "Resource" | "Event";
  name: string;
  category: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
}

export const SUBMISSIONS: Submission[] = [
  { id: "s1", kind: "Vendor", name: "Brewhouse Catering", category: "Food & Catering", description: "Breakfast and snack boxes for offsites.", submittedBy: "Vikram Sethi", submittedAt: "Today" },
  { id: "s2", kind: "Vendor", name: "Heritage Stays Goa", category: "Hotels & Stays", description: "Villa stays for groups of up to 40, with a workshop room.", submittedBy: "Karthik Subramanian", submittedAt: "Yesterday" },
  { id: "s3", kind: "Resource", name: "Exit interview question bank", category: "HR templates", description: "Thirty questions grouped by theme.", submittedBy: "Meera Iyer", submittedAt: "Today" },
  { id: "s4", kind: "Resource", name: "Hiring sprint retro template", category: "Guides and playbooks", description: "A one-page retro for the end of a hiring sprint.", submittedBy: "Aditi Joshi", submittedAt: "3 days ago" },
];

export interface ProfileChangeRequest {
  id: string;
  memberId: string;
  field: string;
  from: string;
  to: string;
  requestedAt: string;
}

export const PROFILE_CHANGES: ProfileChangeRequest[] = [
  { id: "c1", memberId: "m4", field: "Designation", from: "Head of HR Business Partnering", to: "Head of People Operations", requestedAt: "Today" },
  { id: "c2", memberId: "m9", field: "City", from: "Pune", to: "Hyderabad", requestedAt: "Yesterday" },
];

export interface ContactRequest {
  id: string;
  memberId: string;
  requestedBy: string;
  requestedAt: string;
}

export const CONTACT_REQUESTS: ContactRequest[] = [
  { id: "cr1", memberId: "m11", requestedBy: "Rohan Mehta", requestedAt: "Today" },
];

export interface DuplicateCandidate {
  id: string;
  memberId: string;
  /** Match confidence, 0–100. */
  match: number;
  reason: string;
}

export const DUPLICATES: DuplicateCandidate[] = [
  { id: "d1", memberId: "m4", match: 96, reason: "Same phone number and a spelling variant of the name" },
  { id: "d2", memberId: "m11", match: 88, reason: "Same LinkedIn profile" },
  { id: "d3", memberId: "m17", match: 81, reason: "Matching email name and city" },
];

export interface DataIssue {
  id: string;
  severity: "error" | "warning";
  at: string;
  source: string;
  message: string;
}

export const DATA_ISSUES: DataIssue[] = [
  { id: "x1", severity: "error", at: "09:12", source: "Job feed", message: "Careers page layout changed for Loomstack. 0 listings parsed." },
  { id: "x2", severity: "warning", at: "08:40", source: "Job feed", message: "Rate limited by a job board. Retry is scheduled in 30 minutes." },
  { id: "x3", severity: "warning", at: "Yesterday", source: "Member master sheet", message: "4 rows skipped because of an invalid email format." },
];
