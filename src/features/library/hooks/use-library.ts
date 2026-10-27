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
  const { user } = useAuth();
  const role = user?.role ?? "member";
  const userName = user?.name ?? "";
  return useQuery({
    queryKey: [...queryKeys.library.recommendations(), role, userName],
    queryFn: () => libraryService.recommendations({ role, userName }),
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

/** Admin: correct a vendor's details. */
export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.updateVendor,
    onSuccess: (vendor) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.library.vendors() });
      notify.success(`${vendor.name} updated`);
    },
    onError: (error) => notify.fromError(error, "Could not save the vendor"),
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

/** Admin: add and remove vendors, add, edit and remove resources. */
export function useLibraryAdmin() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.library.all });
  const onError = (error: unknown) => notify.fromError(error, "Could not save");
  return {
    createVendor: useMutation({ mutationFn: libraryService.createVendor, onSuccess: (v) => { refresh(); notify.success(`${v.name} added`); }, onError }),
    deleteVendor: useMutation({ mutationFn: libraryService.deleteVendor, onSuccess: () => { refresh(); notify.success("Vendor removed"); }, onError }),
    saveResource: useMutation({ mutationFn: libraryService.saveResource, onSuccess: (r) => { refresh(); notify.success(`${r.title} saved`); }, onError }),
    deleteResource: useMutation({ mutationFn: libraryService.deleteResource, onSuccess: () => { refresh(); notify.success("Resource removed"); }, onError }),
  };
}
