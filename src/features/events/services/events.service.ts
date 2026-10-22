/**
 * Events API calls (spec §9, PRD §6.5).
 *
 * Rules the API must keep too:
 *  - Members see the city only; the full venue is admin only (PRD §3).
 *  - Member-hosted sessions publish only after admin approval.
 *  - Every event says who hosts it: a named Community Member, or
 *    The Talent Mosaic. Admins can tag member co-hosts and prize winners.
 *
 * Backed by a session store over the SAMPLE data until the API exists.
 */
import {
  currentMembers,
  communityStore,
  SAMPLE_AS_OF,
  daysFrom,
  isoDate,
} from "@/lib/sample-data";
import type { CommunityEvent } from "@/types/community";
import type { Role } from "@/types/enums";

import type { AdminEventInput, HostSessionInput, WinnerInput } from "../schemas";

export interface PersonRef {
  id: string;
  name: string;
}

export interface EventView extends CommunityEvent {
  host: { kind: "community" } | ({ kind: "member" } & PersonRef);
  coHosts: PersonRef[];
}

export interface HostedSubmission extends HostSessionInput {
  id: string;
  hostId: string;
  hostName: string;
  submittedOn: string;
  status: "pending" | "rejected";
}

const store = {
  get events() {
    return communityStore.events;
  },
  set events(next: CommunityEvent[]) {
    communityStore.events = next;
  },
  submissions: [] as HostedSubmission[],
};

/** "18:30" → "6:30 PM", matching how every other event shows its time. */
function to12h(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const memberName = (id: string) => currentMembers().find((m) => m.id === id)?.name;

function toView(event: CommunityEvent, role: Role): EventView {
  const hostName = event.hostedBy ?? (event.hostedById ? memberName(event.hostedById) : undefined);
  const view: EventView = {
    ...event,
    registrationUrl: event.registrationUrl ?? `https://register.example/${event.id}`,
    host: hostName
      ? { kind: "member", id: event.hostedById ?? "", name: hostName }
      : { kind: "community" },
    coHosts: (event.coHostIds ?? []).flatMap((id) => {
      const name = memberName(id);
      return name ? [{ id, name }] : [];
    }),
  };
  if (role === "admin") return view;
  const { venue: _venue, ...memberView } = view;
  return memberView;
}

const isUpcoming = (e: CommunityEvent) => daysFrom(e.date, SAMPLE_AS_OF) >= 0;

function patchEvent(id: string, patch: Partial<CommunityEvent>) {
  store.events = store.events.map((e) => (e.id === id ? { ...e, ...patch } : e));
}

export const eventsService = {
  list: async ({ role, userId }: { role: Role; userId: string }) => {
    const all = store.events.map((e) => toView(e, role));
    const past = all.filter((e) => !isUpcoming(e)).sort((a, b) => b.date.localeCompare(a.date));

    return {
      asOf: isoDate(SAMPLE_AS_OF),
      upcoming: all.filter(isUpcoming).sort((a, b) => a.date.localeCompare(b.date)),
      past,
      stats: {
        eventsDone: past.length,
        /** Cities with an in-person or hybrid catchup so far. */
        cities: [...new Set(past.filter((e) => e.city !== "Online").map((e) => e.city))],
        attendees: past.reduce((sum, e) => sum + (e.attended ?? 0), 0),
        photos: past.reduce((sum, e) => sum + (e.photos ?? 0), 0),
      },
      /** Admins review every pending session; members see their own. */
      submissions: store.submissions.filter((s) => role === "admin" || s.hostId === userId),
    };
  },

  detail: async (id: string, role: Role) => {
    const event = store.events.find((e) => e.id === id);
    if (!event) return null;
    return { event: toView(event, role), isUpcoming: isUpcoming(event) };
  },

  /** Members: submit a session they are hosting, for admin approval. */
  hostSession: async (input: HostSessionInput & { hostId: string; hostName: string }) => {
    const submission: HostedSubmission = {
      ...input,
      id: `h${Date.now()}`,
      submittedOn: isoDate(SAMPLE_AS_OF),
      status: "pending",
    };
    store.submissions = [submission, ...store.submissions];
    return submission;
  },

  /** Admin: approve (publishes it) or reject a hosted session. */
  reviewSession: async ({ id, approve }: { id: string; approve: boolean }) => {
    const submission = store.submissions.find((s) => s.id === id);
    if (!submission) throw new Error("Submission not found");
    if (approve) {
      store.events = [
        ...store.events,
        {
          id: `e-${submission.id}`,
          title: submission.title,
          date: submission.date,
          time: to12h(submission.time),
          format: submission.format,
          city: submission.city,
          venue: submission.city,
          category: "Community session",
          description: submission.details,
          hostedById: currentMembers().some((m) => m.id === submission.hostId) ? submission.hostId : undefined,
          hostedBy: submission.hostName,
          registrationUrl: submission.registrationUrl,
          cost: submission.cost === "Free" ? "Free" : `Paid · ${submission.price}`,
        },
      ];
      store.submissions = store.submissions.filter((s) => s.id !== id);
    } else {
      store.submissions = store.submissions.map((s) => (s.id === id ? { ...s, status: "rejected" } : s));
    }
    return submission;
  },

  /** Admin: add an event directly. A past date puts it straight on the timeline. */
  createEvent: async (input: AdminEventInput) => {
    const event: CommunityEvent = {
      id: `a${Date.now()}`,
      title: input.title,
      date: input.date,
      time: input.time ? to12h(input.time) : undefined,
      format: input.format,
      city: input.city,
      venue: input.venue || input.city,
      category: input.category,
      description: input.description,
      registrationUrl: input.registrationUrl || undefined,
      cost: input.cost || undefined,
      winners: [],
    };
    store.events = [...store.events, event];
    return event;
  },

  /** Admin: tag one or more prize winners on a past event. */
  setWinners: async ({ eventId, winners }: { eventId: string; winners: WinnerInput[] }) => {
    patchEvent(eventId, { winners });
  },

  /** Admin: tag member co-hosts so the community can see them. */
  setCoHosts: async ({ eventId, memberIds }: { eventId: string; memberIds: string[] }) => {
    patchEvent(eventId, { coHostIds: memberIds });
  },

  /** Admin: the member picker for co-hosts. */
  memberOptions: async (): Promise<PersonRef[]> =>
    currentMembers().map((m) => ({ id: m.id, name: m.name })).sort((a, b) => a.name.localeCompare(b.name)),
};
