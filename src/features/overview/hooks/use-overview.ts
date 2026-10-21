"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import { overviewService } from "../services/overview.service";

export function useOverviewSummary() {
  return useQuery({
    queryKey: queryKeys.overview.summary(),
    queryFn: overviewService.summary,
  });
}
