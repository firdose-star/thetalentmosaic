"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import { peopleService } from "../services/people.service";
import type { PeopleFilters } from "../types";

export function usePeople(filters: PeopleFilters) {
  const { user } = useAuth();
  const role = user?.role ?? "member";
  return useQuery({
    queryKey: [...queryKeys.people.list(filters), role],
    queryFn: () => peopleService.list(filters, role),
    placeholderData: keepPreviousData,
  });
}

/** Admin only — the caller renders it inside a RoleGuard. */
export function useMemberRecords(filters: PeopleFilters, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.people.list(filters), "records"],
    queryFn: () => peopleService.records(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePeopleFilterOptions() {
  return useQuery({
    queryKey: queryKeys.people.options(),
    queryFn: peopleService.options,
    staleTime: Infinity,
  });
}

export function useMemberProfile(id: string) {
  const { user } = useAuth();
  const role = user?.role ?? "member";
  return useQuery({
    queryKey: queryKeys.people.detail(id, role),
    queryFn: () => peopleService.detail(id, role),
  });
}

export function useRequestContact() {
  return useMutation({
    mutationFn: peopleService.requestContact,
    onSuccess: () =>
      notify.success("Request sent to the admins", {
        description: "They will share contact details if the member agrees.",
      }),
    onError: (error) => notify.fromError(error, "Could not send the request"),
  });
}
