"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import { healthService } from "../services/health.service";

/** All admin only — render consumers inside a RoleGuard. */
export function useEngagement() {
  return useQuery({ queryKey: queryKeys.health.engagement(), queryFn: healthService.engagement });
}

export function useMemberActivity() {
  return useQuery({ queryKey: queryKeys.health.activity(), queryFn: healthService.activity });
}

export function useEngagementTags() {
  return useQuery({ queryKey: queryKeys.health.tags(), queryFn: healthService.tags });
}

export function useUpdateEngagement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: healthService.updateEngagement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.health.community() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      notify.success("Engagement updated");
    },
    onError: (error) => notify.fromError(error, "Could not save"),
  });
}
