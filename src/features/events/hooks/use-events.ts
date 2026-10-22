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
  return () => void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
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
