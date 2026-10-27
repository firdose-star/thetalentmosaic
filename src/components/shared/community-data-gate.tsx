"use client";

/**
 * Holds the signed-in app until the community data has loaded, so every
 * page reads the real members from its first render.
 */
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { LoadingState } from "@/components/shared/state-views";
import { queryKeys } from "@/lib/api/query-keys";
import { loadCommunityData } from "@/lib/community-data";

export function useCommunitySource() {
  return useQuery({
    queryKey: queryKeys.community.source(),
    queryFn: loadCommunityData,
    // Loaded once per session; a reload picks up a newer export.
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function CommunityDataGate({ children }: { children: ReactNode }) {
  const { isPending } = useCommunitySource();
  if (isPending) {
    return (
      <div className="grid min-h-svh place-items-center">
        <LoadingState label="Loading the community…" />
      </div>
    );
  }
  return <>{children}</>;
}
