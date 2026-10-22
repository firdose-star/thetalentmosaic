"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { queryKeys } from "@/lib/api/query-keys";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { searchService } from "../services/search.service";

export function useGlobalSearch(query: string) {
  const { user } = useAuth();
  const debounced = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS);
  const role = user?.role ?? "member";

  return useQuery({
    queryKey: queryKeys.search.query(debounced, role),
    queryFn: () => searchService.search(debounced, role),
    enabled: debounced.length >= 2,
    placeholderData: keepPreviousData,
  });
}
