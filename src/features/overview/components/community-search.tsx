"use client";

/**
 * "Looking for Something / Someone?" (PRD §6.1). Submits to the People
 * directory for now; becomes grouped global search (§6.6) when that lands.
 */
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";

export function CommunitySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `${ROUTES.people}?q=${encodeURIComponent(q)}` : ROUTES.people);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Looking for Something / Someone?</h2>
      <div className="flex max-w-2xl gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, startup, designation, city, interest, vendor, role or event"
            aria-label="Search the community"
            className="h-10 pl-9"
          />
        </div>
        <Button type="submit" size="lg" className="h-10">
          Search
        </Button>
      </div>
    </form>
  );
}
