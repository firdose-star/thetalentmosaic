"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import { libraryService } from "../services/library.service";

export function useVendors() {
  return useQuery({ queryKey: queryKeys.library.vendors(), queryFn: libraryService.vendors });
}

export function useResources() {
  const { user } = useAuth();
  const role = user?.role ?? "member";
  return useQuery({
    queryKey: queryKeys.library.resources(role),
    queryFn: () => libraryService.resources(role),
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: queryKeys.library.recommendations(),
    queryFn: libraryService.recommendations,
  });
}

export function useSuggestVendor() {
  return useMutation({
    mutationFn: libraryService.suggestVendor,
    onSuccess: (vendor) =>
      notify.success("Thanks! Sent to the admins for review", {
        description: `${vendor.name} will appear in the directory once approved.`,
      }),
    onError: (error) => notify.fromError(error, "Could not send the vendor"),
  });
}

export function useRecommend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.recommend,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.library.recommendations() });
      notify.success("Thanks for sharing!", {
        description: "The admins will review it before it is published.",
      });
    },
    onError: (error) => notify.fromError(error, "Could not submit the recommendation"),
  });
}

/** Admin: add, rename and remove vendor categories. */
export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.library.vendors() });
  const onError = (error: unknown) => notify.fromError(error, "Could not update categories");

  return {
    add: useMutation({ mutationFn: libraryService.addCategory, onSuccess: refresh, onError }),
    rename: useMutation({ mutationFn: libraryService.renameCategory, onSuccess: refresh, onError }),
    remove: useMutation({ mutationFn: libraryService.removeCategory, onSuccess: refresh, onError }),
  };
}
