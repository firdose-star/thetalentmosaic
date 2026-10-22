import { z } from "zod";

/** "Recommend a Vendor" form (spec §7.4). */
export const vendorSuggestionSchema = z.object({
  name: z.string().trim().min(2, "Enter the vendor's name"),
  category: z.string().min(1, "Pick a category"),
  description: z.string().trim().min(10, "Add a line on what they do"),
  coverage: z.string().trim().min(2, "Where do they operate?"),
  website: z.string().trim().optional(),
  contact: z.string().trim().optional(),
});
export type VendorSuggestionInput = z.infer<typeof vendorSuggestionSchema>;

/** "Recommendations" form (spec §7.6). The owner is the signed-in member. */
export const recommendationSchema = z.object({
  title: z.string().trim().min(3, "Give it a title"),
  category: z.string().min(1, "Pick a category"),
  description: z.string().trim().min(10, "Tell the community what it is and why it helps"),
  link: z.string().trim().optional(),
});
export type RecommendationInput = z.infer<typeof recommendationSchema>;

export const categorySchema = z.string().trim().min(2, "At least 2 characters").max(40);
