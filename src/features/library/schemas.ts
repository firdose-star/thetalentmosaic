import { z } from "zod";

const optional = z.string().trim().optional().or(z.literal(""));

/**
 * A vendor's details (spec §7.4): name, category, description if any, city,
 * exact area, phone, website, email and Instagram. Used by members to
 * recommend a vendor and by admins to edit one.
 */
export const vendorSchema = z.object({
  name: z.string().trim().min(2, "Enter the vendor's name"),
  category: z.string().min(1, "Pick a category"),
  description: optional,
  city: z.string().trim().min(2, "Which city are they in?"),
  area: optional,
  phone: z
    .string()
    .trim()
    .regex(/^(\+?91)?\s?\d{10}$/, "A 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  website: optional,
  email: z.email("Enter a valid email").optional().or(z.literal("")),
  instagram: optional,
});
export type VendorInput = z.infer<typeof vendorSchema>;

/** "Recommendations" form (spec §7.6). The owner is the signed-in member. */
export const recommendationSchema = z.object({
  title: z.string().trim().min(3, "Give it a title"),
  category: z.string().min(1, "Pick a category"),
  description: z.string().trim().min(10, "Tell the community what it is and why it helps"),
  link: optional,
});
export type RecommendationInput = z.infer<typeof recommendationSchema>;

/** Uploads are limited to documents people share in the community. */
export const UPLOAD_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt";
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const categorySchema = z.string().trim().min(2, "At least 2 characters").max(40);

/** Admin: a resource added or edited directly. */
export const resourceSchema = z.object({
  title: z.string().trim().min(3, "Give it a title"),
  category: z.string().min(1, "Pick a category"),
  description: z.string().trim().min(5, "A line on what it is"),
  source: optional,
  link: z.url("Full link, starting with https://").optional().or(z.literal("")),
  access: z.enum(["All members", "Verified members", "Admins"]),
});
export type ResourceInput = z.infer<typeof resourceSchema>;
