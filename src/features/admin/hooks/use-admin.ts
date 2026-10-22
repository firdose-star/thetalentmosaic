"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { notify } from "@/lib/toast";
import { adminService } from "../services/admin.service";

/** Admin only — render consumers inside a RoleGuard. */
export function useAdminData() {
  // Live: refetch every time an admin page opens, so counts are never stale.
  return useQuery({ queryKey: queryKeys.admin.all, queryFn: adminService.data, staleTime: 0, refetchOnMount: "always" });
}

/**
 * One admin action. The signed-in admin is attached as `by` for the activity
 * log, and every view that shows the same records refreshes afterwards.
 */
function useAdminAction<I extends { by: string }>(fn: (input: I) => Promise<unknown>, success: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<I, "by">) => fn({ ...input, by: user?.name ?? "Admin" } as I),
    onSuccess: () => {
      // Admin edits touch members, the library and events — refresh them all.
      void queryClient.invalidateQueries();
      notify.success(success);
    },
    onError: (error) => notify.fromError(error, "Could not save"),
  });
}

export function useAdminActions() {
  return {
    approveRegistration: useAdminAction(adminService.approveRegistration, "Registration approved — welcome aboard"),
    rejectRegistration: useAdminAction(adminService.rejectRegistration, "Registration declined"),
    applyProfileChange: useAdminAction(adminService.applyProfileChange, "Profile updated"),
    declineProfileChange: useAdminAction(adminService.declineProfileChange, "Change declined"),
    resolveContactRequest: useAdminAction(adminService.resolveContactRequest, "Request resolved"),
    resolveDuplicate: useAdminAction(adminService.resolveDuplicate, "Duplicate resolved"),
    editMember: useAdminAction(adminService.editMember, "Member record saved"),
    setMemberStatus: useAdminAction(adminService.setMemberStatus, "Status updated"),
    approveVendor: useAdminAction(adminService.approveVendor, "Vendor published in the Library"),
    editVendorSuggestion: useAdminAction(
      (input: Parameters<typeof adminService.editVendorSuggestion>[0] & { by: string }) => adminService.editVendorSuggestion(input),
      "Suggestion updated",
    ),
    rejectVendor: useAdminAction(adminService.rejectVendor, "Vendor declined"),
    approveRecommendation: useAdminAction(adminService.approveRecommendation, "Resource published"),
    rejectRecommendation: useAdminAction(adminService.rejectRecommendation, "Resource declined"),
    applyImport: useAdminAction(adminService.applyImport, "Sheet updates applied"),
    skipImport: useAdminAction(adminService.skipImport, "Update skipped"),
    resync: useAdminAction(adminService.resync, "Re-sync complete"),
    resolveIssue: useAdminAction(adminService.resolveIssue, "Issue resolved"),
    importMembers: useAdminAction(adminService.importMembers, "Members imported"),
    updateAutomation: useAdminAction(adminService.updateAutomation, "Automation updated"),
    runAutomation: useAdminAction(adminService.runAutomation, "Automation ran"),
    setUserAccess: useAdminAction(adminService.setUserAccess, "Access updated"),
    invite: useAdminAction(adminService.invite, "Invitation sent"),
    togglePermission: useAdminAction(adminService.togglePermission, "Permission updated"),
  };
}
