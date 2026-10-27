/**
 * Library API calls (spec §7).
 *
 * Backed by an community store so admin edits and new
 * submissions survive navigation for the session. Each method maps to one
 * future endpoint; suggestions go to the admin review queue and never appear
 * in the member-facing lists until approved.
 */
import {
  communityStore,
  SAMPLE_AS_OF,
  isoDate,
  logAdminAction,
  type Recommendation,
  type Resource,
  type Vendor,
} from "@/lib/sample-data";
import type { Role } from "@/types/enums";

import type { RecommendationInput, ResourceInput, VendorInput } from "../schemas";

const store = communityStore.library;

const clean = (input: VendorInput) => ({
  name: input.name,
  category: input.category,
  description: input.description ?? "",
  city: input.city,
  area: input.area ?? "",
  phone: (input.phone ?? "").replace(/\D/g, "").slice(-10),
  website: (input.website ?? "").replace(/^https?:\/\//, ""),
  email: input.email ?? "",
  instagram: (input.instagram ?? "").replace(/^@/, ""),
});

export const libraryService = {
  /** Approved vendors only, alphabetical (spec §7.4). */
  vendors: async () => ({
    vendors: [...store.vendors].sort((a, b) => a.name.localeCompare(b.name)),
    categories: [...store.categories],
  }),

  /** Admin only: correct a vendor's details. */
  updateVendor: async ({ id, input }: { id: string; input: VendorInput }): Promise<Vendor> => {
    const existing = store.vendors.find((v) => v.id === id);
    if (!existing) throw new Error("Vendor not found");
    const updated = { ...existing, ...clean(input) };
    store.vendors = store.vendors.map((v) => (v.id === id ? updated : v));
    return updated;
  },

  /** Admin only: publish a vendor directly, no review step. */
  createVendor: async (input: VendorInput): Promise<Vendor> => {
    const vendor: Vendor = { id: `vendor-${Date.now()}`, ...clean(input), note: "" };
    store.vendors = [...store.vendors, vendor];
    logAdminAction({ actor: "Admin", action: "Added a vendor", object: vendor.name });
    return vendor;
  },

  /** Admin only: remove a vendor from the directory. */
  deleteVendor: async (id: string) => {
    const vendor = store.vendors.find((v) => v.id === id);
    store.vendors = store.vendors.filter((v) => v.id !== id);
    logAdminAction({ actor: "Admin", action: "Removed a vendor", object: vendor?.name ?? id });
  },

  // ── Admin: resources ──
  saveResource: async ({ id, input }: { id?: string; input: ResourceInput }): Promise<Resource> => {
    const resource: Resource = {
      id: id ?? `res-${Date.now()}`,
      title: input.title,
      category: input.category,
      description: input.description,
      source: input.source || "Talent Mosaic team",
      access: input.access,
      link: input.link || undefined,
      addedOn: store.resources.find((r) => r.id === id)?.addedOn ?? isoDate(SAMPLE_AS_OF),
    };
    store.resources = id ? store.resources.map((r) => (r.id === id ? resource : r)) : [resource, ...store.resources];
    logAdminAction({ actor: "Admin", action: id ? "Edited a resource" : "Added a resource", object: resource.title });
    return resource;
  },

  deleteResource: async (id: string) => {
    const resource = store.resources.find((r) => r.id === id);
    store.resources = store.resources.filter((r) => r.id !== id);
    logAdminAction({ actor: "Admin", action: "Removed a resource", object: resource?.title ?? id });
  },

  /** Goes to Submissions & Approvals; not published until approved. */
  suggestVendor: async ({ input, submittedBy }: { input: VendorInput; submittedBy: string }) => {
    const vendor = clean(input);
    communityStore.vendorSuggestions = [
      {
        id: `vs${Date.now()}`,
        vendor: { ...vendor, note: "" },
        submittedBy,
        submittedOn: isoDate(SAMPLE_AS_OF),
        status: "pending",
      },
      ...communityStore.vendorSuggestions,
    ];
    return vendor;
  },

  /** Admin-only resources are never sent to members. */
  resources: async (role: Role) =>
    store.resources.filter((r) => role === "admin" || r.access !== "Admins"),

  /**
   * Latest uploads, newest first. Members see what is published plus their
   * own submissions still in review; admins see everything.
   */
  recommendations: async ({ role, userName }: { role: Role; userName: string }) =>
    store.recommendations
      .filter((r) => role === "admin" || r.status === "Published" || r.owner === userName)
      .sort((a, b) => b.submittedOn.localeCompare(a.submittedOn)),

  recommend: async (
    input: RecommendationInput & { owner: string; fileName?: string },
  ): Promise<Recommendation> => {
    const created: Recommendation = {
      id: `rec${Date.now()}`,
      title: input.title,
      category: input.category,
      owner: input.owner,
      description: input.description,
      status: "Under review",
      submittedOn: isoDate(SAMPLE_AS_OF),
      fileName: input.fileName,
      link: input.link || undefined,
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
    store.vendors = store.vendors.map((v) => (v.category === from ? { ...v, category: to } : v));
    return store.categories;
  },

  removeCategory: async (name: string) => {
    store.categories = store.categories.filter((c) => c !== name);
    return store.categories;
  },
};
