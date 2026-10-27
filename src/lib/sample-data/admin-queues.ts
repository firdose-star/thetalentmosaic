/**
 * Types for the admin work queues (PRD §7). The queues start empty and fill
 * from real activity: registrations, member requests, suggestions and data
 * issues found on import.
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

export interface ProfileChangeRequest {
  id: string;
  memberId: string;
  field: string;
  from: string;
  to: string;
  requestedAt: string;
}

export interface ContactRequest {
  id: string;
  memberId: string;
  requestedBy: string;
  requestedAt: string;
}

export interface DuplicateCandidate {
  id: string;
  memberId: string;
  /** Match confidence, 0–100. */
  match: number;
  reason: string;
  /** The other record, as it appeared in the source. */
  other: { name: string; email: string; startup: string; city: string };
}

export interface DataIssue {
  id: string;
  severity: "error" | "warning";
  at: string;
  source: string;
  message: string;
}
