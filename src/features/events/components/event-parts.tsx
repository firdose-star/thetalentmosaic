/**
 * Small pieces shared by the events views and the detail page.
 */
import { ImageIcon, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { parseDay } from "@/lib/community";
import { cn } from "@/lib/utils";
import type { CommunityEvent } from "@/types/community";

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
      <span className="text-[0.625rem] text-muted-foreground">{d.getFullYear()}</span>
    </span>
  );
}

/** Members see the city; admins see the full venue (PRD §3). */
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

const PHOTO_TONES = ["from-chart-2/60 to-accent", "from-chart-3/60 to-accent", "from-chart-4/50 to-accent", "from-chart-5/70 to-accent"];

/** Photo strip placeholder until real photographs are uploaded. */
export function PhotoStrip({ count, max = 4 }: { count: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5">
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
    return <span className="text-xs text-muted-foreground">No winners for this one</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {winners.map((w) => (
        <Badge key={`${w.prize}-${w.winner}`} className="gap-1 bg-chart-3/20 text-foreground">
          <Trophy data-icon="inline-start" className="text-chart-3" />
          <span className="font-medium">{w.prize}:</span> {w.winner}
        </Badge>
      ))}
    </div>
  );
}
