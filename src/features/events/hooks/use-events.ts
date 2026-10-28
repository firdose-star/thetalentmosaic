"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import { eventsService } from "../services/events.service";

export function useEvents() {
  const { user } = useAuth();
  const role = user?.role ?? "member";
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: [...queryKeys.events.list(), role, userId],
    queryFn: () => eventsService.list({ role, userId }),
  });
}

export function useEvent(id: string) {
  const { user } = useAuth();
  const role = user?.role ?? "member";
  return useQuery({
    queryKey: [...queryKeys.events.detail(id), role],
    queryFn: () => eventsService.detail(id, role),
  });
}

/** Admin: members to pick co-hosts from. */
export function useEventMemberOptions() {
  return useQuery({
    queryKey: [...queryKeys.events.all, "member-options"],
    queryFn: eventsService.memberOptions,
    staleTime: Infinity,
  });
}

function useRefreshEvents() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    // Health lists events attended and reach, so new or edited events refresh it too.
    void queryClient.invalidateQueries({ queryKey: queryKeys.health.community() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.overview.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
  };
}

export function useHostSession() {
  const refresh = useRefreshEvents();
  return useMutation({
    mutationFn: eventsService.hostSession,
    onSuccess: () => {
      refresh();
      notify.success("Thanks! Your session is with the admins", {
        description: "It will appear under Upcoming Events once approved.",
      });
    },
    onError: (error) => notify.fromError(error, "Could not submit your session"),
  });
}

export function useEventAdminActions() {
  const refresh = useRefreshEvents();
  const onError = (error: unknown) => notify.fromError(error, "Could not update the event");

  return {
    review: useMutation({
      mutationFn: eventsService.reviewSession,
      onSuccess: (s, { approve }) => {
        refresh();
        notify.success(approve ? `"${s.title}" is published` : `"${s.title}" was rejected`);
      },
      onError,
    }),
    update: useMutation({
      mutationFn: eventsService.updateEvent,
      onSuccess: (e) => {
        refresh();
        notify.success(`"${e.title}" saved`);
      },
      onError,
    }),
    remove: useMutation({
      mutationFn: eventsService.deleteEvent,
      onSuccess: () => {
        refresh();
        notify.success("Event removed");
      },
      onError,
    }),
    attendees: useMutation({
      mutationFn: eventsService.setAttendees,
      onSuccess: () => {
        refresh();
        notify.success("Attendees saved");
      },
      onError,
    }),
    create: useMutation({
      mutationFn: eventsService.createEvent,
      onSuccess: (e) => {
        refresh();
        notify.success(`"${e.title}" added`);
      },
      onError,
    }),
    winners: useMutation({
      mutationFn: eventsService.setWinners,
      onSuccess: () => {
        refresh();
        notify.success("Winners saved");
      },
      onError,
    }),
    coHosts: useMutation({
      mutationFn: eventsService.setCoHosts,
      onSuccess: () => {
        refresh();
        notify.success("Co-hosts saved");
      },
      onError,
    }),
  };
}

/** Admin: every member, with whether they attended this event. */
export function useEventAttendees(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.events.detail(eventId), "attendees"],
    queryFn: () => eventsService.attendees(eventId),
    enabled,
  });
}

/**
 * An event's photos. While the folder is still being ranked for admins, checks back
 * every 20 seconds so the picker shows the best first.
 */
export function useEventAlbum(event: { id: string; momentsUrl?: string; photosUrl?: string }) {
  return useQuery({
    queryKey: queryKeys.events.album(event.id, event.momentsUrl, event.photosUrl),
    queryFn: () => eventsService.album(event),
    staleTime: 5 * 60_000,
    refetchInterval: (query) => (query.state.data?.ranking === "scoring" ? 20_000 : false),
  });
}

/** Admin: save which photos members see for an event. */
export function useSaveHighlights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eventsService.saveHighlights,
    onSuccess: (_, { ids }) => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.events.all, "album"] });
      notify.success(ids.length ? `${ids.length} photos saved` : "Photos cleared");
    },
    onError: (error) => notify.fromError(error, "Could not save the photos"),
  });
}

/** Admin: upload photos for an event. */
export function useUploadPhotos() {
  return useMutation({
    mutationFn: eventsService.uploadPhotos,
    onSuccess: ({ ids, rejected }) => {
      if (rejected.length) notify.error(`Skipped ${rejected.length} file${rejected.length > 1 ? "s" : ""} that aren't photos: ${rejected.join(", ")}`);
      if (ids.length) notify.success(`${ids.length} photo${ids.length > 1 ? "s" : ""} uploaded`);
    },
    onError: (error) => notify.fromError(error, "Could not upload the photos"),
  });
}
