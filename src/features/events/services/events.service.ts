/**
 * Events API calls (spec §9).
 *
 * Members see the city only; the full venue is admin only (PRD §3) and is
 * stripped here before it ever reaches a member — the API must do the same.
 * Computed from the SAMPLE dataset until the API exists.
 */
import {
  PAST_EVENTS,
  SAMPLE_AS_OF,
  UPCOMING_EVENTS,
  daysFrom,
  isoDate,
} from "@/lib/sample-data";
import type { CommunityEvent } from "@/types/community";
import type { Role } from "@/types/enums";

function forViewer(event: CommunityEvent, role: Role): CommunityEvent {
  const withLink: CommunityEvent = {
    ...event,
    registrationUrl: event.registrationUrl ?? `https://register.example/${event.id}`,
  };
  if (role === "admin") return withLink;
  const { venue: _venue, ...rest } = withLink;
  return rest;
}

export const eventsService = {
  list: async (role: Role) => {
    const all = [...UPCOMING_EVENTS, ...PAST_EVENTS].map((e) => forViewer(e, role));
    return {
      asOf: isoDate(SAMPLE_AS_OF),
      upcoming: all
        .filter((e) => daysFrom(e.date, SAMPLE_AS_OF) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date)),
      past: all
        .filter((e) => daysFrom(e.date, SAMPLE_AS_OF) < 0)
        .sort((a, b) => b.date.localeCompare(a.date)),
    };
  },

  detail: async (id: string, role: Role) => {
    const event = [...UPCOMING_EVENTS, ...PAST_EVENTS].find((e) => e.id === id);
    if (!event) return null;
    return {
      event: forViewer(event, role),
      isUpcoming: daysFrom(event.date, SAMPLE_AS_OF) >= 0,
    };
  },
};
