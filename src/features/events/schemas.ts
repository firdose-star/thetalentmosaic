import { z } from "zod";

/**
 * "Host a session" (PRD §6.5): any member can tell the community about a
 * session they are hosting. It publishes after admin approval.
 */
export const hostSessionSchema = z
  .object({
    title: z.string().trim().min(3, "Give your session a name"),
    city: z.string().trim().min(2, "Which city? (or Online)"),
    date: z.string().min(1, "Pick a date"),
    time: z.string().min(1, "Pick a time"),
    format: z.enum(["In person", "Online", "Hybrid"]),
    details: z.string().trim().min(20, "Tell people what to expect (a couple of lines)"),
    registrationUrl: z.url("Paste the full registration link, starting with https://"),
    cost: z.enum(["Free", "Paid"]),
    price: z.string().trim().optional(),
  })
  .refine((v) => v.cost === "Free" || Boolean(v.price), {
    path: ["price"],
    message: "Add the price for a paid event",
  });

export type HostSessionInput = z.infer<typeof hostSessionSchema>;

export const winnerSchema = z.object({
  prize: z.string().trim().min(1, "Prize or round"),
  winner: z.string().trim().min(1, "Member or team"),
});
export type WinnerInput = z.infer<typeof winnerSchema>;

/** Admin: add an event directly — upcoming or past. */
export const adminEventSchema = z.object({
  title: z.string().trim().min(3, "Event name"),
  date: z.string().min(1, "Pick a date"),
  time: z.string().optional(),
  format: z.enum(["In person", "Online", "Hybrid"]),
  city: z.string().trim().min(2, "City, or Online"),
  venue: z.string().trim().optional(),
  category: z.string().trim().min(2, "e.g. Mixer, Workshop, Roundtable"),
  description: z.string().trim().min(10, "A line or two about it"),
  registrationUrl: z.url("Full link, starting with https://").optional().or(z.literal("")),
  cost: z.string().trim().optional(),
});
export type AdminEventInput = z.infer<typeof adminEventSchema>;
