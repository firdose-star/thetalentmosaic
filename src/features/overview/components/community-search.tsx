"use client";

/**
 * The welcome band: greeting plus "Looking for Something / Someone?" search
 * (PRD §6.1). Search submits to the People directory for now; it becomes
 * grouped global search (§6.6) when that lands.
 */
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BRAND_TAGLINE } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/constants";

/** Decorative mosaic: tiles at varying opacity — many people, one picture. */
const TILES = [90, 35, 60, 20, 45, 80, 25, 55, 70, 15, 40, 65];

export function CommunitySearch() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const firstName = user?.name.split(" ")[0];

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `${ROUTES.people}?q=${encodeURIComponent(q)}` : ROUTES.people);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-chart-1 p-6 text-primary-foreground md:p-8">
      <div
        aria-hidden
        className="absolute top-1/2 right-8 hidden -translate-y-1/2 grid-cols-4 gap-2 @4xl/main:grid"
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

        <form onSubmit={onSubmit} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, startup, city, interest, vendor, role or event"
              aria-label="Search the community"
              className="h-11 w-full rounded-xl border-0 bg-background pr-3 pl-10 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-primary-foreground/40"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="h-11 rounded-xl px-5"
          >
            Search
          </Button>
        </form>
      </div>
    </section>
  );
}
