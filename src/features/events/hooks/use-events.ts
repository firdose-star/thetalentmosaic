"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { eventsService } from "../services/events.service";

export function useEvents() {
  const { user } = useAuth();
  const role = user?.role ?? "member";
  return useQuery({
    queryKey: [...queryKeys.events.list(), role],
    queryFn: () => eventsService.list(role),
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
