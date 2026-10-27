"use client";

/**
 * Event detail: everything about one catchup — date and time, format, venue
 * (full for admins, city for members), who hosts it and any co-hosts,
 * description, registration for upcoming
 * events, and for past ones the Moments hero, the best photos and winners.
 */
import { ArrowLeft, CalendarDays, Clock, MapPin, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FadeIn } from "@/components/shared/motion";
import { RoleGuard } from "@/components/shared/role-guard";
import { Section } from "@/components/shared/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/constants";
import { useEvent } from "../hooks/use-events";
import { CoHostsDialog, WinnersDialog } from "./event-admin-dialogs";
import { AttendeesDialog, DeleteEventButton, EventFormDialog } from "./event-editor";
import { DateTile, HostLine, Winners, longDate, venueText } from "./event-parts";
import { EventHero, EventPhotos } from "./event-photos";

export function EventDetail({ id }: { id: string }) {
  const { data, isPending, isError, error, refetch } = useEvent(id);
  const router = useRouter();
  const isAdmin = useAuth().user?.role === "admin";

  const back = (
    <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={ROUTES.events} />}>
      <ArrowLeft data-icon="inline-start" />
      Community Catchups
    </Button>
  );

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;
  if (!data) {
    return (
      <>
        {back}
        <EmptyState icon={CalendarDays} title="Event not found" />
      </>
    );
  }

  const { event, isUpcoming } = data;
  const hasWinners = (event.winners?.length ?? 0) > 0;
  const attendedLine = event.attended ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Users className="size-4" />{event.attended} members attended
    </span>
  ) : null;

  return (
    <FadeIn className="flex flex-col gap-4">
      {back}

      {!isUpcoming && <EventHero event={event} />}

      <Card className="flex-row flex-wrap items-start gap-5 p-6">
        <DateTile date={event.date} className="w-16" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={isUpcoming ? "default" : "outline"}>{isUpcoming ? "Upcoming" : "Past event"}</Badge>
            <Badge variant="secondary">{event.format}</Badge>
            <Badge variant="outline">{event.category}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{event.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{longDate(event.date)}</span>
            {event.time && <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{event.time}</span>}
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{venueText(event)}</span>
          </p>
          <HostLine event={event} className="mt-2" />
          <RoleGuard allow={["admin"]}>
            <div className="mt-3 flex flex-wrap gap-2">
              {!isUpcoming && <WinnersDialog event={event} />}
              <CoHostsDialog event={event} />
              <AttendeesDialog event={event} />
              <EventFormDialog event={event} />
              <DeleteEventButton event={event} onDeleted={() => router.push(ROUTES.events)} />
            </div>
          </RoleGuard>
        </div>
        {isUpcoming && event.registrationUrl && (
          <Button size="lg" nativeButton={false} render={<a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" />}>
            <Ticket data-icon="inline-start" />
            Register
          </Button>
        )}
      </Card>

      <div className="grid items-start gap-4 @4xl/main:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Section title="About this catchup">
            <p className="text-sm leading-relaxed">{event.description}</p>
          </Section>
          {event.momentsUrl || event.photosUrl ? (
            <Section title="Photos" description="The best of the day. Tap a photo to see it full size.">
              <EventPhotos event={event} />
            </Section>
          ) : null}
        </div>

        {isUpcoming ? (
          <Section title="Registration">
            <div className="flex flex-col gap-2 text-sm">
              {event.capacity && event.registered !== undefined ? (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-muted-foreground" />
                  {event.registered} of {event.capacity} spots taken
                </span>
              ) : null}
              <span>{event.cost ?? "Free for members"}</span>
            </div>
          </Section>
        ) : hasWinners || isAdmin ? (
          // Members only see this once an admin has tagged the winners.
          <Section title="Winners of the Catchup">
            <div className="flex flex-col gap-3">
              {hasWinners ? (
                <Winners winners={event.winners} />
              ) : (
                <span className="text-xs text-muted-foreground">Not tagged yet — members won&apos;t see this section until you tag the winners.</span>
              )}
              {attendedLine}
            </div>
          </Section>
        ) : event.attended ? (
          <Section title="At the catchup">{attendedLine}</Section>
        ) : null}
      </div>
    </FadeIn>
  );
}
