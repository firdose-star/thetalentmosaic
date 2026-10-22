/**
 * Small pieces shared by the events views and the detail page.
 */
import { ImageIcon, ShieldCheck, Trophy, UserRound } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { parseDay } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CommunityEvent } from "@/types/community";
import type { EventView } from "../services/events.service";

export function DateTile({ date, className }: { date: string; className?: string }) {
  const d = parseDay(date);
  return (
    <span
      className={cn(
        "flex w-14 shrink-0 flex-col items-center rounded-xl bg-accent py-2 leading-tight text-primary",
        className,
      )}
    >
      <span className="text-[0.625rem] font-semibold uppercase">
        {d.toLocaleDateString("en-IN", { month: "short" })}
      </span>
      <span className="text-xl font-semibold tabular-nums">{d.getDate()}</span>
      <span className="text-[0.625rem] opacity-70">{d.getFullYear()}</span>
    </span>
  );
}

/** Members see the city; admins also see the full venue (PRD §3). */
export function venueText(event: CommunityEvent) {
  return event.venue ?? (event.city === "Online" ? "Online" : event.city);
}

export function longDate(date: string) {
  return parseDay(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "Hosted by The Talent Mosaic" or "Hosted by Karthik Rao, a Community Member", plus co-hosts. */
export function HostLine({ event, className }: { event: EventView; className?: string }) {
  const people = (list: { id: string; name: string }[]) =>
    list.map((p, i) => (
      <span key={p.id}>
        {i > 0 && (i === list.length - 1 ? " and " : ", ")}
        <Link href={`${ROUTES.people}/${p.id}`} className="font-medium underline-offset-2 hover:underline">
          {p.name}
        </Link>
      </span>
    ));

  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs", className)}>
      {event.host.kind === "member" ? (
        <span className="inline-flex items-center gap-1 text-chart-3">
          <UserRound className="size-3.5" aria-hidden />
          Hosted by{" "}
          {event.host.id ? (
            <Link href={`${ROUTES.people}/${event.host.id}`} className="font-medium underline-offset-2 hover:underline">
              {event.host.name}
            </Link>
          ) : (
            <span className="font-medium">{event.host.name}</span>
          )}
          , a Community Member
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-primary">
          <ShieldCheck className="size-3.5" aria-hidden />
          Hosted by The Talent Mosaic
        </span>
      )}
      {event.coHosts.length > 0 && (
        <span className="text-muted-foreground">· Co-hosted by {people(event.coHosts)}</span>
      )}
    </p>
  );
}

const PHOTO_TONES = ["from-chart-2/60 to-accent", "from-chart-3/60 to-accent", "from-chart-4/50 to-accent", "from-chart-5/70 to-accent"];

/** Photo strip placeholder until real photographs are uploaded. */
export function PhotoStrip({ count, max = 4 }: { count: number; max?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: Math.min(max, count) }).map((_, i) => (
        <span
          key={i}
          className={cn("flex h-12 w-16 items-center justify-center rounded-lg bg-linear-to-br", PHOTO_TONES[i % PHOTO_TONES.length])}
        >
          <ImageIcon className="size-4 text-foreground/40" aria-hidden />
        </span>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{count} photos</span>
    </div>
  );
}

export function Winners({ winners }: { winners: CommunityEvent["winners"] }) {
  if (!winners || winners.length === 0) {
    return <span className="text-xs text-muted-foreground">Winners not tagged yet</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {winners.map((w) => (
        <Badge key={`${w.prize}-${w.winner}`} className="h-auto gap-1 bg-chart-3/20 py-0.5 whitespace-normal text-foreground">
          <Trophy data-icon="inline-start" className="text-chart-3" />
          <span className="font-medium">{w.prize}:</span> {w.winner}
        </Badge>
      ))}
    </div>
  );
}
