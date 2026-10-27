/**
 * Library types and the default vendor categories. Vendors come from the
 * Mastersheet's Vendor Form; resources and recommendations are added by
 * members and admins. There is no sample content.
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
  /** City or cities served, e.g. "Bangalore" or "Pan-India". */
  city: string;
  /** Exact area or address, when the vendor has a physical location. */
  area: string;
  website: string;
  instagram: string;
  /** 10-digit Indian mobile; also their WhatsApp. */
  phone: string;
  email: string;
  /** Point of contact at the vendor. */
  contactName?: string;
  note: string;
}

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
  /** Where to read it, when it lives online. */
  link?: string;
}

export type RecommendationStatus = "Under review" | "Published" | "Not approved";

export interface Recommendation {
  id: string;
  title: string;
  owner: string;
  description: string;
  status: RecommendationStatus;
  submittedOn: string;
  category?: string;
  /** Why an admin didn't publish it. */
  reason?: string;
  /** Name of an uploaded file, when the member attached one. */
  fileName?: string;
  link?: string;
}
