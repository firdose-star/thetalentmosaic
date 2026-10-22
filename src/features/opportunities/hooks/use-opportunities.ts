"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/lib/api/query-keys";
import { opportunitiesService } from "../services/opportunities.service";

export function useOpportunities() {
  const { user } = useAuth();
  const role = user?.role ?? "member";
  return useQuery({
    queryKey: queryKeys.opportunities.list(role),
    queryFn: () => opportunitiesService.list(role),
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: queryKeys.opportunities.detail(id),
    queryFn: () => opportunitiesService.detail(id),
  });
}

/** Admin only — render the consumer inside a RoleGuard. */
export function useScraperStatus() {
  return useQuery({
    queryKey: queryKeys.opportunities.scraper(),
    queryFn: opportunitiesService.scraper,
  });
}
