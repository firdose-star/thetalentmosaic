"use client";

/**
 * Community Catchups — the fun page. Stat blocks up top, a "host your own"
 * banner, then three views: Upcoming (next event highlighted), Past (a
 * timeline by year) and Calendar (month picker, 📍 city on every event).
 * The active view and past-event filters live in the URL.
 */
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, PartyPopper, Ticket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FilterSelect, ResultCount } from "@/components/shared/filter-bar";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { parseDay } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useEvents } from "../hooks/use-events";
import type { EventView } from "../services/events.service";
import { AttendeesDialog, DeleteEventButton, EventFormDialog } from "./event-editor";
import { CoHostsDialog, WinnersDialog } from "./event-admin-dialogs";
import { DateTile, EventMedia, HostLine, Winners, longDate, venueText } from "./event-parts";
import { HostedSubmissions } from "./hosted-submissions";
import { HostSessionDialog } from "./host-session-dialog";

const FILTER_KEYS = ["view", "year", "format", "category"] as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

// ── Stat blocks ──────────────────────────────────────────────────────────────

function StatBlocks({ stats }: { stats: { eventsDone: number; cities: string[]; attendees: number; photos: number } }) {
  const blocks = [
    { emoji: "🎉", value: stats.eventsDone, label: "Events done till now", tone: "from-chart-2/30" },
    { emoji: "🙌", value: `${stats.attendees.toLocaleString("en-IN")}+`, label: "Seats filled across catchups", tone: "from-chart-3/30" },
    { emoji: "📸", value: stats.photos, label: "Catchups with photo albums", tone: "from-chart-4/25" },
  ];

  return (
    <Stagger className="grid gap-3 @3xl/main:grid-cols-2 @6xl/main:grid-cols-4">
      {blocks.map((b) => (
        <StaggerItem key={b.label} whileHover={{ y: -3, rotate: -0.5 }}>
          <Card className={cn("h-full gap-1 bg-linear-to-br to-card p-5", b.tone)}>
            <span className="text-2xl" aria-hidden>{b.emoji}</span>
            <span className="text-3xl font-bold tabular-nums">{b.value}</span>
            <span className="text-sm text-muted-foreground">{b.label}</span>
          </Card>
        </StaggerItem>
      ))}
      <StaggerItem whileHover={{ y: -3, rotate: 0.5 }} className="@3xl/main:col-span-2 @6xl/main:col-span-1">
        <Card className="h-full gap-2 bg-linear-to-br from-chart-5/40 to-card p-5">
          <span className="text-2xl" aria-hidden>📍</span>
          <span className="text-sm font-medium">Cities we’ve done events in</span>
          <div className="flex flex-wrap gap-1.5">
            {stats.cities.map((city) => (
              <Badge key={city} className="bg-primary text-primary-foreground">{city}</Badge>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">We’ll cover other cities soon ✨</span>
        </Card>
      </StaggerItem>
    </Stagger>
  );
}

// ── Upcoming ────────────────────────────────────────────────────────────────

function RegisterButton({ event, size = "sm" }: { event: EventView; size?: "sm" | "lg" }) {
  if (!event.registrationUrl) return null;
  return (
    <Button size={size} nativeButton={false} render={<a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" />}>
      <Ticket data-icon="inline-start" />
      Register
    </Button>
  );
}

function FeaturedEvent({ event }: { event: EventView }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
      <Card className="relative gap-0 overflow-hidden border-2 border-primary/40 p-0">
        <div className="bg-linear-to-br from-primary to-chart-1 px-6 py-3 text-primary-foreground">
          <p className="flex items-center gap-2 text-sm font-medium">
            <PartyPopper className="size-4" aria-hidden />
            We can’t wait for you to be part of this
          </p>
        </div>
        <div className="flex flex-col gap-5 p-6 @3xl/main:flex-row">
          <DateTile date={event.date} className="w-20 py-3 [&>span:nth-child(2)]:text-3xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{event.format}</Badge>
              <Badge variant="outline">{event.category}</Badge>
            </div>
            <Link href={`${ROUTES.events}/${event.id}`} className="text-2xl font-semibold tracking-tight hover:text-primary">
              {event.title}
            </Link>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{longDate(event.date)}</span>
              {event.time && <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{event.time}</span>}
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{venueText(event)}</span>
            </p>
            <p className="text-sm">{event.description}</p>
            <HostLine event={event} />
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <RegisterButton event={event} size="lg" />
              <Button size="lg" variant="ghost" nativeButton={false} render={<Link href={`${ROUTES.events}/${event.id}`} />}>
                Details
              </Button>
              {event.capacity && event.registered !== undefined && (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {event.registered} of {event.capacity} spots taken
                </span>
              )}
              <RoleGuard allow={["admin"]}>
                <CoHostsDialog event={event} />
                <AttendeesDialog event={event} />
                <EventFormDialog event={event} />
                <DeleteEventButton event={event} />
              </RoleGuard>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function UpcomingCard({ event }: { event: EventView }) {
  return (
    <Card className="h-full flex-row gap-4 p-5">
      <DateTile date={event.date} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link href={`${ROUTES.events}/${event.id}`} className="font-semibold hover:text-primary">
            {event.title}
          </Link>
          <Badge variant="secondary">{event.format}</Badge>
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {event.time && <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{event.time}</span>}
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{venueText(event)}</span>
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        <HostLine event={event} />
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <RegisterButton event={event} />
          {event.cost && <span className="text-xs text-muted-foreground">{event.cost}</span>}
          <RoleGuard allow={["admin"]}>
            <CoHostsDialog event={event} />
            <AttendeesDialog event={event} />
            <EventFormDialog event={event} />
            <DeleteEventButton event={event} />
          </RoleGuard>
        </div>
      </div>
    </Card>
  );
}

// ── Past: timeline ───────────────────────────────────────────────────────────

function Timeline({ events }: { events: EventView[] }) {
  const years = unique(events.map((e) => e.date.slice(0, 4))).reverse();

  return (
    <div className="relative pl-8">
      <div aria-hidden className="absolute top-2 bottom-2 left-2.75 w-0.5 rounded-full bg-linear-to-b from-chart-2 to-border" />
      {years.map((year) => (
        <section key={year} className="mb-6 last:mb-0">
          <h3 className="relative mb-3 text-2xl font-bold tracking-tight">
            <span aria-hidden className="absolute top-1/2 -left-8 size-6 -translate-y-1/2 rounded-full border-4 border-background bg-primary ring-2 ring-primary" />
            {year}
          </h3>
          <Stagger className="flex flex-col gap-3">
            {events
              .filter((e) => e.date.startsWith(year))
              .map((event) => (
                <StaggerItem key={event.id} className="relative">
                  <span aria-hidden className="absolute top-6 left-[-1.6rem] size-3.5 rounded-full border-[3px] border-background bg-chart-2 ring-2 ring-chart-2" />
                  <Card className="gap-3 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-primary">
                          {parseDay(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} · 📍 {event.city}
                        </p>
                        <Link href={`${ROUTES.events}/${event.id}`} className="text-lg font-semibold hover:text-primary">
                          {event.title}
                        </Link>
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant="outline">{event.category}</Badge>
                        <Badge variant="secondary">{event.format}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <HostLine event={event} />
                    <EventMedia event={event} />
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                      <Winners winners={event.winners} />
                      <div className="flex items-center gap-2">
                        {event.attended ? <span className="text-xs text-muted-foreground">{event.attended} attended</span> : null}
                        <RoleGuard allow={["admin"]}>
                          <WinnersDialog event={event} />
                          <CoHostsDialog event={event} />
                          <AttendeesDialog event={event} />
                          <EventFormDialog event={event} />
                          <DeleteEventButton event={event} />
                        </RoleGuard>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}

// ── Calendar ────────────────────────────────────────────────────────────────

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function CalendarView({ events, asOf }: { events: EventView[]; asOf: string }) {
  const today = parseDay(asOf);
  const [key, setKey] = useState(monthKey(today));
  const [year, monthNumber] = key.split("-").map(Number);
  const m = monthNumber - 1;

  // Every month from the first catchup to the last scheduled one.
  const dates = events.map((e) => parseDay(e.date)).sort((a, b) => a.getTime() - b.getTime());
  const months: Date[] = [];
  if (dates.length) {
    for (let d = new Date(dates[0].getFullYear(), dates[0].getMonth(), 1); d <= dates[dates.length - 1]; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      months.push(d);
    }
  }
  const step = (delta: number) => setKey(monthKey(new Date(year, m + delta, 1)));

  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const leading = (new Date(year, m, 1).getDay() + 6) % 7; // Monday-first
  const cells = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const byDay = (day: number) =>
    events.filter((e) => {
      const d = parseDay(e.date);
      return d.getFullYear() === year && d.getMonth() === m && d.getDate() === day;
    });
  const inMonth = events.filter((e) => e.date.startsWith(key));

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="outline" aria-label="Previous month" onClick={() => step(-1)}>
            <ChevronLeft />
          </Button>
          <NativeSelect aria-label="Month" value={key} onChange={(e) => setKey(e.target.value)} className="w-44">
            {months.map((d) => (
              <NativeSelectOption key={monthKey(d)} value={monthKey(d)}>
                {d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button size="icon-sm" variant="outline" aria-label="Next month" onClick={() => step(1)}>
            <ChevronRight />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {inMonth.length === 0 ? "No catchups this month" : `${inMonth.length} catchup${inMonth.length > 1 ? "s" : ""} this month`}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-muted-foreground">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const dayEvents = byDay(day);
          const isToday = today.getFullYear() === year && today.getMonth() === m && today.getDate() === day;
          return (
            <div
              key={day}
              className={cn(
                "flex min-h-24 flex-col gap-1 rounded-lg border p-1.5 text-left",
                dayEvents.length > 0 ? "border-primary/30 bg-accent/60" : "border-transparent bg-muted/40",
                isToday && "ring-2 ring-primary",
              )}
            >
              <span className="text-xs font-medium tabular-nums">{day}</span>
              {dayEvents.map((e) => (
                <Link
                  key={e.id}
                  href={`${ROUTES.events}/${e.id}`}
                  className="flex flex-col rounded bg-primary px-1 py-0.5 text-[0.625rem] leading-tight text-primary-foreground hover:opacity-90"
                  title={`${e.title} · ${e.city}`}
                >
                  <span className="truncate font-medium">{e.title}</span>
                  <span className="truncate opacity-90">📍 {e.city}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Page body ───────────────────────────────────────────────────────────────

export function EventsView() {
  const { values, set } = useUrlFilters(FILTER_KEYS);
  const { data, isPending, isError, error, refetch } = useEvents();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  const [featured, ...rest] = data.upcoming;
  const past = data.past.filter(
    (e) =>
      (!values.year || e.date.startsWith(values.year)) &&
      (!values.format || e.format === values.format) &&
      (!values.category || e.category === values.category),
  );

  return (
    <div className="flex flex-col gap-5">
      <StatBlocks stats={data.stats} />

      <Card className="flex-col items-start gap-4 border-dashed bg-accent/50 p-5 @3xl/main:flex-row @3xl/main:items-center">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Hosting a session of your own? 🎤</h2>
          <p className="text-sm text-muted-foreground">
            Tell the community about it — name, location, details and how to register. It goes live once the admins approve it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RoleGuard allow={["admin"]}>
            <EventFormDialog />
          </RoleGuard>
          <HostSessionDialog />
        </div>
      </Card>

      <HostedSubmissions submissions={data.submissions} />

      <Tabs value={values.view || "upcoming"} onValueChange={(v) => set("view", v === "upcoming" ? "" : String(v))}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 flex flex-col gap-4">
          {!featured ? (
            <EmptyState icon={CalendarDays} title="No upcoming events" description="Check back soon — or host one!" />
          ) : (
            <>
              <FeaturedEvent event={featured} />
              {rest.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-muted-foreground">Also coming up</h3>
                  <Stagger className="grid gap-4 @5xl/main:grid-cols-2">
                    {rest.map((event) => (
                      <StaggerItem key={event.id}>
                        <UpcomingCard event={event} />
                      </StaggerItem>
                    ))}
                  </Stagger>
                </>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 flex flex-col gap-4">
          <div className="grid gap-2 @2xl/main:grid-cols-3">
            <FilterSelect label="Year" allLabel="All years" value={values.year} options={unique(data.past.map((e) => e.date.slice(0, 4))).reverse()} onChange={(v) => set("year", v)} />
            <FilterSelect label="Format" allLabel="All formats" value={values.format} options={unique(data.past.map((e) => e.format))} onChange={(v) => set("format", v)} />
            <FilterSelect label="Category" allLabel="All categories" value={values.category} options={unique(data.past.map((e) => e.category))} onChange={(v) => set("category", v)} />
          </div>
          {past.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No past events match" />
          ) : (
            <>
              <ResultCount count={past.length} noun={["catchup", "catchups"]} />
              <Timeline key={`${values.year}-${values.format}-${values.category}`} events={past} />
            </>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView events={[...data.upcoming, ...data.past]} asOf={data.asOf} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
