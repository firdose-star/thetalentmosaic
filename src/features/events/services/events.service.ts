/**
 * Events API calls (spec §9, PRD §6.5).
 *
 * Rules the API must keep too:
 *  - Members see the city only; the full venue is admin only (PRD §3).
 *  - Member-hosted sessions publish only after admin approval.
 *  - Every event says who hosts it: a named Community Member, or
 *    The Talent Mosaic. Admins can tag member co-hosts and prize winners.
 *
 * Backed by a community store until the API exists.
 */
import {
  currentMembers,
  communityStore,
  SAMPLE_AS_OF,
  daysFrom,
  isoDate,
  logAdminAction,
  type HostedSessionRecord,
} from "@/lib/sample-data";
import { loadEventAlbum, saveEventHighlights, uploadEventPhotos } from "@/lib/event-photos";
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

/** Member-hosted sessions awaiting review — the same queue Admin › Submissions shows. */
export type HostedSubmission = HostedSessionRecord;

const store = {
  get events() {
    return communityStore.events;
  },
  set events(next: CommunityEvent[]) {
    communityStore.events = next;
  },
  get submissions() {
    return communityStore.hostedSubmissions;
  },
  set submissions(next: HostedSubmission[]) {
    communityStore.hostedSubmissions = next;
  },
};

/** "18:30" → "6:30 PM", matching how every other event shows its time. */
function to12h(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "Hosted by" text → a member link when it names a member, else the name as typed. */
function resolveHost(host?: string): Pick<CommunityEvent, "hostedBy" | "hostedById"> {
  const name = host?.trim();
  if (!name || name.toLowerCase() === "the talent mosaic") return { hostedBy: undefined, hostedById: undefined };
  const member = currentMembers().find((m) => m.name.toLowerCase() === name.toLowerCase());
  return member ? { hostedBy: undefined, hostedById: member.id } : { hostedBy: name, hostedById: undefined };
}

/** Admin form → event fields (shared by add and edit). */
const fromInput = (input: AdminEventInput) => ({
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
  momentsUrl: input.momentsUrl || undefined,
  photosUrl: input.photosUrl || undefined,
  ...resolveHost(input.host),
});

const memberName = (id: string) => currentMembers().find((m) => m.id === id)?.name;

function toView(event: CommunityEvent, role: Role): EventView {
  const hostName = event.hostedBy ?? (event.hostedById ? memberName(event.hostedById) : undefined);
  const view: EventView = {
    ...event,
    attended: currentMembers().filter((m) => m.eventsAttended.includes(event.id)).length || undefined,
    registrationUrl: event.registrationUrl,
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
        photos: past.filter((e) => e.photosUrl || e.momentsUrl).length,
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
      logAdminAction({ actor: "Admin", action: "Published a hosted session", object: `${submission.title} · by ${submission.hostName}` });
    } else {
      store.submissions = store.submissions.map((s) => (s.id === id ? { ...s, status: "rejected" } : s));
      logAdminAction({ actor: "Admin", action: "Declined a hosted session", object: submission.title });
    }
    return submission;
  },

  /** Admin: add an event directly. A past date puts it straight on the timeline. */
  createEvent: async (input: AdminEventInput) => {
    const event: CommunityEvent = { id: `a${Date.now()}`, ...fromInput(input), winners: [] };
    store.events = [...store.events, event];
    logAdminAction({ actor: "Admin", action: "Added an event", object: `${event.title} · ${event.date}` });
    return event;
  },

  /** Admin: change any detail of an event. */
  updateEvent: async ({ id, input }: { id: string; input: AdminEventInput }) => {
    const before = store.events.find((e) => e.id === id);
    if (!before) throw new Error("Event not found");
    const event = { ...before, ...fromInput(input) };
    store.events = store.events.map((e) => (e.id === id ? event : e));
    logAdminAction({ actor: "Admin", action: "Edited an event", object: `${event.title} · ${event.date}` });
    return event;
  },

  /** Admin: remove an event, and untag it from every member. */
  deleteEvent: async (id: string) => {
    const event = store.events.find((e) => e.id === id);
    store.events = store.events.filter((e) => e.id !== id);
    communityStore.members = communityStore.members.map((m) =>
      m.eventsAttended.includes(id) ? { ...m, eventsAttended: m.eventsAttended.filter((x) => x !== id) } : m,
    );
    logAdminAction({ actor: "Admin", action: "Removed an event", object: event?.title ?? id });
  },

  /** Admin: exactly which members attended an event. */
  setAttendees: async ({ eventId, memberIds }: { eventId: string; memberIds: string[] }) => {
    const chosen = new Set(memberIds);
    communityStore.members = communityStore.members.map((m) => {
      const has = m.eventsAttended.includes(eventId);
      if (chosen.has(m.id) && !has) return { ...m, eventsAttended: [...m.eventsAttended, eventId] };
      if (!chosen.has(m.id) && has) return { ...m, eventsAttended: m.eventsAttended.filter((x) => x !== eventId) };
      return m;
    });
    patchEvent(eventId, { attended: chosen.size });
    logAdminAction({ actor: "Admin", action: "Tagged attendees", object: store.events.find((e) => e.id === eventId)?.title ?? eventId, change: `${chosen.size} members` });
  },

  /** Admin: members to tag, with whether each attended this event. */
  attendees: async (eventId: string) =>
    currentMembers()
      .map((m) => ({ id: m.id, name: m.name, startup: m.startup, attended: m.eventsAttended.includes(eventId) }))
      .sort((a, b) => a.name.localeCompare(b.name)),

  /** Admin: tag one or more prize winners on a past event. */
  setWinners: async ({ eventId, winners }: { eventId: string; winners: WinnerInput[] }) => {
    patchEvent(eventId, { winners });
    logAdminAction({ actor: "Admin", action: "Tagged winners", object: store.events.find((e) => e.id === eventId)?.title ?? eventId, change: winners.map((w) => `${w.prize}: ${w.winner}`).join(", ") });
  },

  /** Admin: tag member co-hosts so the community can see them. */
  setCoHosts: async ({ eventId, memberIds }: { eventId: string; memberIds: string[] }) => {
    patchEvent(eventId, { coHostIds: memberIds });
    logAdminAction({ actor: "Admin", action: "Tagged co-hosts", object: store.events.find((e) => e.id === eventId)?.title ?? eventId, change: memberIds.map((id) => memberName(id)).join(", ") || "None" });
  },

  /** Admin: the member picker for co-hosts. */
  memberOptions: async (): Promise<PersonRef[]> =>
    currentMembers().map((m) => ({ id: m.id, name: m.name })).sort((a, b) => a.name.localeCompare(b.name)),

  /** The event's photos from its Drive links: the Moments hero and the hand-picked best. */
  album: (event: Pick<CommunityEvent, "momentsUrl" | "photosUrl">) =>
    loadEventAlbum({ moments: event.momentsUrl, photos: event.photosUrl }),

  /** Admin: save the photos members see for an event (up to 30). */
  saveHighlights: async ({ albumKey, ids, hidden, title }: { albumKey: string; ids: string[]; hidden?: string[]; title: string }) => {
    await saveEventHighlights(albumKey, ids, hidden);
    logAdminAction({ actor: "Admin", action: ids.length ? "Picked event photos" : "Cleared event photos", object: `${title} · ${ids.length} photos` });
  },

  /** Admin: upload photos from this computer (they're added to the event separately). */
  uploadPhotos: async ({ files, title }: { files: File[]; title: string }) => {
    const result = await uploadEventPhotos(files);
    if (result.ids.length) logAdminAction({ actor: "Admin", action: "Uploaded event photos", object: `${title} · ${result.ids.length} photos` });
    return result;
  },
};
