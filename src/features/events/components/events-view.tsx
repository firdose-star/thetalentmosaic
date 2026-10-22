"use client";

/**
 * Community Catchups (spec §9.2): three views — Upcoming, Past and Calendar.
 * The active view and the past-event filters (year, format, category) live in
 * the URL.
 */
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Ticket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FilterPanel, FilterSelect, ResultCount } from "@/components/shared/filter-bar";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { parseDay } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CommunityEvent } from "@/types/community";
import { useEvents } from "../hooks/use-events";
import { DateTile, PhotoStrip, Winners, venueText } from "./event-parts";

const FILTER_KEYS = ["view", "year", "format", "category"] as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

function UpcomingCard({ event }: { event: CommunityEvent }) {
  return (
    <Card className="flex-row gap-4 p-5">
      <DateTile date={event.date} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link href={`${ROUTES.events}/${event.id}`} className="font-semibold hover:text-primary">
            {event.title}
          </Link>
          <div className="flex gap-1.5">
            <Badge variant="secondary">{event.format}</Badge>
            <Badge variant="outline">{event.category}</Badge>
          </div>
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {event.time && <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{event.time}</span>}
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{venueText(event)}</span>
        </p>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        {event.hostedBy && (
          <p className="text-xs text-chart-3">Hosted by {event.hostedBy}, a Community Member</p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {event.registrationUrl && (
            <Button size="sm" nativeButton={false} render={<a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" />}>
              <Ticket data-icon="inline-start" />
              Register
            </Button>
          )}
          <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={`${ROUTES.events}/${event.id}`} />}>
            Details
          </Button>
          {event.capacity && event.registered !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {event.registered} of {event.capacity} registered
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function PastCard({ event }: { event: CommunityEvent }) {
  return (
    <Card className="h-full gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`${ROUTES.events}/${event.id}`} className="font-semibold hover:text-primary">
            {event.title}
          </Link>
          <p className="text-sm text-muted-foreground">
            {parseDay(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {event.city}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">{event.category}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{event.description}</p>
      {event.photos ? <PhotoStrip count={event.photos} /> : null}
      <div className="mt-auto flex flex-col gap-1.5 border-t pt-3">
        <Winners winners={event.winners} />
        {event.attended ? (
          <span className="text-xs text-muted-foreground">{event.attended} attended</span>
        ) : null}
      </div>
    </Card>
  );
}

function CalendarView({ events, asOf }: { events: CommunityEvent[]; asOf: string }) {
  const start = parseDay(asOf);
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const year = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const leading = (new Date(year, m, 1).getDay() + 6) % 7; // Monday-first
  const cells = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const byDay = (day: number) =>
    events.filter((e) => {
      const d = parseDay(e.date);
      return d.getFullYear() === year && d.getMonth() === m && d.getDate() === day;
    });

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="outline" aria-label="Previous month" onClick={() => setMonth(new Date(year, m - 1, 1))}>
            <ChevronLeft />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMonth(new Date(start.getFullYear(), start.getMonth(), 1))}>
            Today
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Next month" onClick={() => setMonth(new Date(year, m + 1, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-muted-foreground">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const dayEvents = byDay(day);
          const isToday =
            start.getFullYear() === year && start.getMonth() === m && start.getDate() === day;
          return (
            <div
              key={day}
              className={cn(
                "flex min-h-20 flex-col gap-1 rounded-lg border p-1.5 text-left",
                dayEvents.length > 0 ? "border-primary/30 bg-accent/60" : "border-transparent bg-muted/40",
                isToday && "ring-2 ring-primary",
              )}
            >
              <span className="text-xs font-medium tabular-nums">{day}</span>
              {dayEvents.map((e) => (
                <Link
                  key={e.id}
                  href={`${ROUTES.events}/${e.id}`}
                  className="truncate rounded bg-primary px-1 py-0.5 text-[0.625rem] font-medium text-primary-foreground hover:opacity-90"
                  title={e.title}
                >
                  {e.title}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function EventsView() {
  const { values, set } = useUrlFilters(FILTER_KEYS);
  const { data, isPending, isError, error, refetch } = useEvents();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  const past = data.past.filter(
    (e) =>
      (!values.year || e.date.startsWith(values.year)) &&
      (!values.format || e.format === values.format) &&
      (!values.category || e.category === values.category),
  );

  return (
    <Tabs value={values.view || "upcoming"} onValueChange={(v) => set("view", v === "upcoming" ? "" : String(v))}>
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
        <TabsTrigger value="past">Past Events</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        {data.upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No upcoming events" description="Check back soon." />
        ) : (
          <Stagger className="grid gap-4 @5xl/main:grid-cols-2">
            {data.upcoming.map((event) => (
              <StaggerItem key={event.id}>
                <UpcomingCard event={event} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4 flex flex-col gap-4">
        <FilterPanel className="@2xl/main:flex-row">
          <FilterSelect label="Year" allLabel="All years" value={values.year} options={unique(data.past.map((e) => e.date.slice(0, 4))).reverse()} onChange={(v) => set("year", v)} />
          <FilterSelect label="Format" allLabel="All formats" value={values.format} options={unique(data.past.map((e) => e.format))} onChange={(v) => set("format", v)} />
          <FilterSelect label="Category" allLabel="All categories" value={values.category} options={unique(data.past.map((e) => e.category))} onChange={(v) => set("category", v)} />
        </FilterPanel>
        {past.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No past events match" />
        ) : (
          <>
            <ResultCount count={past.length} noun={["event", "events"]} />
            <Stagger key={`${values.year}-${values.format}-${values.category}`} className="grid gap-4 @3xl/main:grid-cols-2 @6xl/main:grid-cols-3">
              {past.map((event) => (
                <StaggerItem key={event.id}>
                  <PastCard event={event} />
                </StaggerItem>
              ))}
            </Stagger>
          </>
        )}
      </TabsContent>

      <TabsContent value="calendar" className="mt-4">
        <CalendarView events={[...data.upcoming, ...data.past]} asOf={data.asOf} />
      </TabsContent>
    </Tabs>
  );
}
