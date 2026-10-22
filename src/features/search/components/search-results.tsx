"use client";

/**
 * Grouped search results — one block per category, each row linking to the
 * record. Rendered under any search box that uses `useGlobalSearch`.
 */
import { BookOpen, Briefcase, CalendarDays, Loader2, Store, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";

import type { SearchCategory, SearchGroup } from "../types";

const ICONS: Record<SearchCategory, LucideIcon> = {
  People: Users,
  Vendors: Store,
  Resources: BookOpen,
  Roles: Briefcase,
  Events: CalendarDays,
};

export function SearchResults({
  groups,
  isLoading,
  onNavigate,
}: {
  groups: SearchGroup[] | undefined;
  isLoading: boolean;
  onNavigate?: () => void;
}) {
  if (isLoading && !groups) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Searching…
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Nothing found. Try a name, a startup, a city or a topic.
      </p>
    );
  }

  return (
    <div className="grid max-h-[26rem] gap-3 overflow-y-auto p-2 sm:grid-cols-2">
      {groups.map((group) => {
        const Icon = ICONS[group.category];
        return (
          <section key={group.category}>
            <h3 className="flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Icon className="size-3.5" aria-hidden />
              {group.category}
              {group.total && group.total > group.results.length ? (
                <span className="normal-case tracking-normal">
                  · {group.results.length} of {group.total}
                </span>
              ) : null}
            </h3>
            <ul>
              {group.results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    onClick={onNavigate}
                    className="block rounded-md px-2 py-1.5 outline-none hover:bg-accent focus-visible:bg-accent"
                  >
                    <span className="block truncate text-sm font-medium">{result.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
