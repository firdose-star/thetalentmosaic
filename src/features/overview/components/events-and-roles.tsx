"use client";

/**
 * Upcoming events and active opportunities (PRD §6.1). Compact lists with a
 * "See all" into each section.
 */
import { ArrowRight, Briefcase, CalendarDays } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseDay } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import type { OverviewSummary } from "../types";

function SeeAll({ href }: { href: string }) {
  return (
    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={href} />}>
      See all
      <ArrowRight data-icon="inline-end" />
    </Button>
  );
}

function postedText(days: number | null) {
  if (days === null) return "Date not available";
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

export function UpcomingEventsPanel({
  events,
  total,
}: {
  events: OverviewSummary["nextEvents"];
  total: number;
}) {
  return (
    <Section
      title="Upcoming events"
      description={`${total} on the calendar`}
      actions={<SeeAll href={ROUTES.events} />}
      contentClassName="flex flex-col"
    >
      {events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No upcoming events" />
      ) : (
        events.map((event) => {
          const date = parseDay(event.date);
          return (
            <Link
              key={event.id}
              href={`${ROUTES.events}/${event.id}`}
              className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/60"
            >
              <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-accent py-1 leading-tight text-primary">
                <span className="text-base font-semibold tabular-nums">{date.getDate()}</span>
                <span className="text-[0.625rem] font-medium uppercase">
                  {date.toLocaleDateString("en-IN", { month: "short" })}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{event.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[event.time, event.city].filter(Boolean).join(" · ")}
                </span>
              </span>
              <Badge variant="secondary" className="shrink-0">
                {event.format}
              </Badge>
            </Link>
          );
        })
      )}
    </Section>
  );
}

export function LatestRolesPanel({
  roles,
  total,
}: {
  roles: OverviewSummary["latestRoles"];
  total: number;
}) {
  return (
    <Section
      title="Active opportunities"
      description={`${total} open HR roles`}
      actions={<SeeAll href={ROUTES.opportunities} />}
      contentClassName="flex flex-col"
    >
      {roles.length === 0 ? (
        <EmptyState icon={Briefcase} title="No open roles right now" />
      ) : (
        roles.map((role) => (
          <Link
            key={role.id}
            href={`${ROUTES.opportunities}/${role.id}`}
            className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/60"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <Briefcase className="size-4.5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{role.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {role.company} · {role.location}
              </span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {postedText(role.postedDaysAgo)}
            </span>
          </Link>
        ))
      )}
    </Section>
  );
}
