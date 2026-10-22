/**
 * Library API calls (spec §7).
 *
 * Backed by an in-memory copy of the SAMPLE data so admin edits and new
 * submissions survive navigation for the session. Each method maps to one
 * future endpoint; suggestions go to the admin review queue and never appear
 * in the member-facing lists until approved.
 */
import {
  RECOMMENDATIONS,
  RESOURCES,
  SAMPLE_AS_OF,
  VENDOR_CATEGORIES,
  VENDORS,
  isoDate,
  type Recommendation,
} from "@/lib/sample-data";
import type { Role } from "@/types/enums";

import type { RecommendationInput, VendorSuggestionInput } from "../schemas";

const store = {
  categories: [...VENDOR_CATEGORIES],
  recommendations: [...RECOMMENDATIONS],
};

export const libraryService = {
  vendors: async () => ({ vendors: VENDORS, categories: [...store.categories] }),

  /** Admin-only resources are never sent to members. */
  resources: async (role: Role) =>
    RESOURCES.filter((r) => role === "admin" || r.access !== "Admins"),

  recommendations: async () => [...store.recommendations],

  /** Goes to Submissions & Approvals; not published until approved. */
  suggestVendor: async (input: VendorSuggestionInput) => ({ ...input, status: "Under review" as const }),

  recommend: async (input: RecommendationInput & { owner: string }): Promise<Recommendation> => {
    const created: Recommendation = {
      id: `rec${Date.now()}`,
      title: input.title,
      owner: input.owner,
      description: input.description,
      status: "Under review",
      submittedOn: isoDate(SAMPLE_AS_OF),
    };
    store.recommendations = [created, ...store.recommendations];
    return created;
  },

  // ── Admin: vendor categories (spec §7.4) ──
  addCategory: async (name: string) => {
    if (store.categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      throw new Error(`"${name}" already exists`);
    }
    store.categories = [...store.categories, name];
    return store.categories;
  },

  renameCategory: async ({ from, to }: { from: string; to: string }) => {
    store.categories = store.categories.map((c) => (c === from ? to : c));
    return store.categories;
  },

  removeCategory: async (name: string) => {
    store.categories = store.categories.filter((c) => c !== name);
    return store.categories;
  },
};
