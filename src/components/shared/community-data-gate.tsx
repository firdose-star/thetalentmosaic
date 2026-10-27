"use client";

/**
 * Holds the signed-in app until the community data has loaded, so every
 * page reads the real members from its first render.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { queryKeys } from "@/lib/api/query-keys";
import { communityDataLost, loadCommunityData } from "@/lib/community-data";

export function useCommunitySource() {
  return useQuery({
    queryKey: queryKeys.community.source(),
    queryFn: loadCommunityData,
    // Loaded once per session; a reload picks up a newer export.
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });
}

export function CommunityDataGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, refetch } = useCommunitySource();
  const lost = !!data && communityDataLost(data);

  // Reload if the store was emptied under us, then let every page re-read it.
  useEffect(() => {
    if (!lost) return;
    void refetch().then(() =>
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "community" }),
    );
  }, [lost, refetch, queryClient]);

  if (isPending || lost) {
    return (
      <div className="grid min-h-svh place-items-center">
        <LoadingState label="Loading the community…" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="grid min-h-svh place-items-center px-6">
        <ErrorState title="The community data didn't load" error={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  return <>{children}</>;
}
