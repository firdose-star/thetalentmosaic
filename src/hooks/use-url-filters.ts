"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * Filter state held in the URL, keyed by a fixed list of param names.
 *
 *   const { values, set, clear, clearAll } = useUrlFilters(["q", "city"] as const)
 *
 * Why the URL: filtered lists become shareable, survive refresh and
 * back/forward, and Overview cards can deep-link into a filtered directory
 * (`/people?city=Mumbai`). `replace` (not `push`) so typing in a search box
 * doesn't flood the history.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo(
    () =>
      Object.fromEntries(keys.map((key) => [key, searchParams.get(key) ?? ""])) as Record<
        K,
        string
      >,
    [keys, searchParams],
  );

  const write = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const set = useCallback(
    (key: K, value: string) =>
      write((params) => (value ? params.set(key, value) : params.delete(key))),
    [write],
  );

  const clear = useCallback((key: K) => write((params) => params.delete(key)), [write]);

  const clearAll = useCallback(
    () => write((params) => keys.forEach((key) => params.delete(key))),
    [keys, write],
  );

  const activeCount = keys.filter((key) => values[key]).length;

  return { values, set, clear, clearAll, activeCount };
}
