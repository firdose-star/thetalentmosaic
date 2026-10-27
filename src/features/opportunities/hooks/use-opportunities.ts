"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import { opportunitiesService } from "../services/opportunities.service";

export function useOpportunities() {
  const { user } = useAuth();
  const role = user?.role ?? "member";
  return useQuery({
    queryKey: queryKeys.opportunities.list(role),
    queryFn: () => opportunitiesService.list(role),
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: queryKeys.opportunities.detail(id),
    queryFn: () => opportunitiesService.detail(id),
  });
}

/** Admin only — render the consumer inside a RoleGuard. */
export function useScraperStatus() {
  return useQuery({
    queryKey: queryKeys.opportunities.scraper(),
    queryFn: opportunitiesService.scraper,
  });
}

/** Admin: add, edit and remove listings by hand. */
export function useJobAdmin() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
  const onError = (error: unknown) => notify.fromError(error, "Could not save the listing");
  return {
    create: useMutation({ mutationFn: opportunitiesService.create, onSuccess: (j) => { refresh(); notify.success(`${j.title} added`); }, onError }),
    update: useMutation({ mutationFn: opportunitiesService.update, onSuccess: (j) => { refresh(); notify.success(`${j.title} saved`); }, onError }),
    remove: useMutation({ mutationFn: opportunitiesService.remove, onSuccess: () => { refresh(); notify.success("Listing removed"); }, onError }),
  };
}
