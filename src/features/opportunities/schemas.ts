import { z } from "zod";

import { HR_FUNCTIONS, SENIORITY_LEVELS } from "@/types/community";

/** Admin: a job listing added or edited by hand. */
export const jobSchema = z.object({
  title: z.string().trim().min(2, "Job title"),
  company: z.string().trim().min(1, "Company"),
  location: z.string().trim().min(2, "Location"),
  hrFunction: z.enum(HR_FUNCTIONS),
  seniority: z.enum(SENIORITY_LEVELS),
  arrangement: z.enum(["Hybrid", "On-site", "Remote"]),
  type: z.enum(["Full-time", "Contract", "Internship"]),
  url: z.url("The original application link, starting with https://"),
  source: z.string().trim().optional(),
  salary: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  description: z.string().trim().optional(),
  skills: z.string().trim().optional(),
  status: z.enum(["active", "expired", "review"]),
});
export type JobInput = z.infer<typeof jobSchema>;
