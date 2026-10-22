"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import { healthService } from "../services/health.service";

/** Admin only — render consumers inside a RoleGuard. */
export function useHealthData() {
  return useQuery({ queryKey: queryKeys.health.community(), queryFn: healthService.data });
}

/** One admin action: run it, then refresh every view showing these members. */
function useAction<T>(fn: (input: T) => Promise<unknown>, success: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.health.community() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.overview.all });
      notify.success(success);
    },
    onError: (error) => notify.fromError(error, "Could not save"),
  });
}

/** Every admin action on Community Health. */
export function useHealthActions() {
  return {
    logInteraction: useAction(healthService.logInteraction, "Interaction logged"),
    updateInteraction: useAction(healthService.updateInteraction, "Interaction updated"),
    deleteInteraction: useAction(healthService.deleteInteraction, "Interaction removed"),
    markContacted: useAction(healthService.markContacted, "Marked as contacted"),
    setOwner: useAction(healthService.setOwner, "Owner updated"),
    snooze: useAction(healthService.snooze, "Snooze updated"),
    updateMember: useAction(healthService.updateMember, "Member updated"),
    updateThresholds: useAction(healthService.updateThresholds, "Thresholds saved"),
    addOwner: useAction(healthService.addOwner, "Owner added"),
    renameOwner: useAction(healthService.renameOwner, "Owner renamed"),
    removeOwner: useAction(healthService.removeOwner, "Owner removed"),
    addType: useAction(healthService.addType, "Interaction type added"),
    renameType: useAction(healthService.renameType, "Interaction type renamed"),
    removeType: useAction(healthService.removeType, "Interaction type removed"),
    saveOutcome: useAction(healthService.saveOutcome, "Outcome saved"),
    removeOutcome: useAction(healthService.removeOutcome, "Outcome removed"),
  };
}
