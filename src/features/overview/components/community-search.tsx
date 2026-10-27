"use client";

/**
 * The welcome band: greeting plus "Looking for Something / Someone?" global
 * search (spec §5). Results appear grouped by category as you type and
 * respect the viewer's permissions.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useRef, useState } from "react";

import { BRAND_TAGLINE } from "@/components/layout/brand";
import { useAuth } from "@/hooks/use-auth";
import { SearchResults, useGlobalSearch } from "@/features/search";

/** Decorative mosaic: tiles at varying opacity — many people, one picture. */
const TILES = [90, 35, 60, 20, 45, 80, 25, 55, 70, 15, 40, 65];

export function CommunitySearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const search = useGlobalSearch(query);
  const firstName = user?.name.split(" ")[0];
  const showResults = open && query.trim().length >= 2;

  return (
    <section className="relative z-20 rounded-2xl bg-linear-to-br from-primary to-chart-1 p-6 text-primary-foreground md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-8 hidden -translate-y-1/2 grid-cols-4 gap-2 @4xl/main:grid"
      >
        {TILES.map((opacity, i) => (
          <span
            key={i}
            className="size-9 rounded-lg bg-primary-foreground"
            style={{ opacity: opacity / 400 }}
          />
        ))}
      </div>

      <div className="relative max-w-2xl">
        <p className="text-sm font-medium opacity-80">
          {firstName ? `Welcome back, ${firstName}` : "Welcome to The Talent Mosaic Community"}
          <span className="hidden sm:inline"> · {BRAND_TAGLINE}</span>
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          Looking for Something / Someone?
        </h2>

        <div
          ref={wrapperRef}
          className="relative mt-5"
          onBlur={(event) => {
            if (!wrapperRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
          }}
        >
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
            placeholder="Name, startup, designation, city, hobby, vendor, role or event"
            aria-label="Search the community"
            className="h-11 w-full rounded-xl border-0 bg-background pr-3 pl-10 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-primary-foreground/40"
          />

          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-0 top-full mt-2 rounded-xl border bg-popover text-popover-foreground shadow-lg"
              >
                <SearchResults
                  groups={search.data}
                  isLoading={search.isFetching}
                  onNavigate={() => setOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
