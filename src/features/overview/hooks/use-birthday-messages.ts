"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import { birthdayMessagesService } from "../services/birthday-messages.service";

/** Admin only — render the consumer inside a RoleGuard. */
export function useBirthdayMessages() {
  return useQuery({
    queryKey: queryKeys.overview.birthdayMessages(),
    queryFn: birthdayMessagesService.list,
  });
}

export function useBirthdayMessageActions() {
  const queryClient = useQueryClient();
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.overview.birthdayMessages() });
  const onError = (error: unknown) => notify.fromError(error, "Could not update the message");

  return {
    update: useMutation({ mutationFn: birthdayMessagesService.update, onSuccess: refresh, onError }),
    reset: useMutation({ mutationFn: birthdayMessagesService.reset, onSuccess: refresh, onError }),
  };
}
