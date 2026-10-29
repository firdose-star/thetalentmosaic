"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import type { RoleStatus } from "@/types/roles";

import { opportunitiesService, type RoleFilters } from "../services/opportunities.service";

export function useRoles(filters: RoleFilters) {
  const role = useAuth().user?.role ?? "member";
  return useQuery({
    queryKey: queryKeys.opportunities.list(role, filters),
    queryFn: () => opportunitiesService.list(role, filters),
    placeholderData: keepPreviousData,
  });
}

export function useRole(id: string) {
  const role = useAuth().user?.role ?? "member";
  return useQuery({
    queryKey: queryKeys.opportunities.detail(id, role),
    queryFn: () => opportunitiesService.detail(role, id),
  });
}

/** Admin only — render the consumer inside a RoleGuard. */
export function useAdminRoles(status: RoleStatus, page: number) {
  return useQuery({
    queryKey: queryKeys.opportunities.admin(status, page),
    queryFn: () => opportunitiesService.adminList(status, page),
    placeholderData: keepPreviousData,
  });
}

/** Admin: add, edit, approve, hide and delete roles. */
export function useRoleAdmin() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
  const onError = (error: unknown) => notify.fromError(error, "Could not save the role");
  return {
    create: useMutation({ mutationFn: opportunitiesService.create, onSuccess: (r) => { refresh(); notify.success(`${r.title} added`); }, onError }),
    update: useMutation({
      mutationFn: opportunitiesService.update,
      onSuccess: (r, { patch }) => {
        refresh();
        const only = patch.status && Object.keys(patch).length === 1;
        notify.success(only ? `${r.title}: ${patch.status === "approved" ? "approved — members can see it" : patch.status}` : `${r.title} saved`);
      },
      onError,
    }),
    remove: useMutation({ mutationFn: opportunitiesService.remove, onSuccess: () => { refresh(); notify.success("Role deleted"); }, onError }),
    fromUrl: useMutation({ mutationFn: opportunitiesService.fromUrl, onSuccess: refresh }),
  };
}

/** Admin: the boards the feed polls, and recent runs. */
export function useJobFeed() {
  return useQuery({ queryKey: queryKeys.opportunities.feed(), queryFn: opportunitiesService.feed });
}

export function useJobFeedAdmin() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
  const onError = (error: unknown) => notify.fromError(error, "Could not update the job feed");
  return {
    addSource: useMutation({ mutationFn: opportunitiesService.addSource, onSuccess: (s) => { refresh(); notify.success(`${s.companyName ?? s.slug} added`); }, onError }),
    toggleSource: useMutation({ mutationFn: opportunitiesService.toggleSource, onSuccess: refresh, onError }),
    runNow: useMutation({
      mutationFn: opportunitiesService.runNow,
      onSuccess: (runs) => {
        refresh();
        const inserted = runs.reduce((n, r) => n + r.inserted, 0);
        const updated = runs.reduce((n, r) => n + r.updated, 0);
        const errors = runs.reduce((n, r) => n + r.errors.length, 0);
        notify.success(`Run finished: ${inserted} new, ${updated} seen again${errors ? `, ${errors} errors` : ""}`);
      },
      onError,
    }),
  };
}
