/**
 * Birthday messages (PRD §7, §10): the system drafts a message for every
 * birthday in the next 10 days; an admin edits and approves it and picks when
 * it goes out. At that time it opens a pre-filled WhatsApp chat for the
 * sender — nothing is sent without approval. (Fully automatic sending through
 * the WhatsApp Business API is "Later" in the PRD.)
 *
 * Admin only: phone numbers never reach members. State lives in a session
 * store until the API exists.
 */
import {
  SAMPLE_AS_OF,
  addDays,
  communityStore,
  currentMembers,
  daysUntilBirthday,
  isoDate,
} from "@/lib/sample-data";

export const DEFAULT_TEMPLATE =
  "Happy birthday, {first}! 🎂 Wishing you a year full of great people moments, from all of us at The Talent Mosaic Community. 💚";

export const SEND_OFFSETS = [
  { value: 0, label: "On the day" },
  { value: 1, label: "1 day before" },
  { value: 2, label: "2 days before" },
  { value: 7, label: "1 week before" },
];

export const SEND_TIMES = Array.from({ length: 33 }, (_, i) => {
  const minutes = 6 * 60 + i * 30; // 06:00 → 22:00
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export type BirthdayMessageStatus = "needs-approval" | "approved" | "rejected" | "sent";

export interface BirthdayMessage {
  memberId: string;
  name: string;
  designation: string;
  startup: string;
  whatsapp: string;
  inDays: number;
  birthdayOn: string;
  text: string;
  status: BirthdayMessageStatus;
  offsetDays: number;
  time: string;
  sentAt: string | null;
}

type Override = Partial<Pick<BirthdayMessage, "text" | "status" | "offsetDays" | "time" | "sentAt">>;
const overrides = communityStore.birthday.overrides as Map<string, Override>;
/** Applies to every message that has no day or time of its own. */
const defaults = communityStore.birthday.defaults;

const draft = (name: string) => DEFAULT_TEMPLATE.replace("{first}", name.split(" ")[0]);

export const birthdayMessagesService = {
  list: async (): Promise<BirthdayMessage[]> =>
    currentMembers().map((m) => ({ m, inDays: daysUntilBirthday(m.birthday, SAMPLE_AS_OF) }))
      .filter(({ inDays }) => inDays <= 10)
      .sort((a, b) => a.inDays - b.inDays)
      .map(({ m, inDays }) => ({
        memberId: m.id,
        name: m.name,
        designation: m.designation,
        startup: m.startup,
        whatsapp: m.whatsapp,
        inDays,
        birthdayOn: isoDate(addDays(SAMPLE_AS_OF, inDays)),
        text: draft(m.name),
        status: "needs-approval" as const,
        offsetDays: defaults.offsetDays,
        time: defaults.time,
        sentAt: null,
        ...overrides.get(m.id),
      })),

  update: async ({ memberId, ...patch }: Override & { memberId: string }) => {
    overrides.set(memberId, { ...overrides.get(memberId), ...patch });
  },

  defaults: async () => ({ ...defaults }),

  /** Admin: the default send day and time for all messages. */
  setDefaults: async (input: { offsetDays: number; time: string }) => {
    Object.assign(defaults, input);
  },

  reset: async (memberId: string) => {
    overrides.delete(memberId);
  },
};

/** wa.me link with the approved message pre-filled. */
export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}

/** "9:00 AM" */
export function time12(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
