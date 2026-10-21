"use client";

/**
 * The KPI row: six compact tiles on one line at desktop widths. Every tile is
 * clickable (PRD §6.1) — it opens the list behind the number.
 */
import {
  Building2,
  Cake,
  Compass,
  MapPin,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OverviewSummary } from "../types";

const GRID =
  "grid grid-cols-2 gap-3 @2xl/main:grid-cols-3 @5xl/main:grid-cols-6";

interface Tile {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  href: string;
  /** Tint for the icon chip — semantic accents, not decoration. */
  tone: string;
}

export function SnapshotStats({ summary }: { summary: OverviewSummary }) {
  const { totals, birthdays, recentMembers } = summary;

  const tiles: Tile[] = [
    { label: "Members", value: totals.members, hint: "Approved", icon: Users, href: ROUTES.people, tone: "bg-accent text-primary" },
    { label: "Startups", value: totals.startups, hint: "Unique", icon: Building2, href: ROUTES.people, tone: "bg-accent text-primary" },
    { label: "Cities", value: totals.cities, hint: "Represented", icon: MapPin, href: ROUTES.people, tone: "bg-accent text-primary" },
    { label: "Seniority", value: totals.seniorityLevels, hint: "Levels", icon: Compass, href: ROUTES.people, tone: "bg-accent text-primary" },
    {
      label: "Birthdays",
      value: birthdays.today.length + birthdays.upcoming.length,
      hint: `${birthdays.today.length} today`,
      icon: Cake,
      href: "#birthdays",
      tone: "bg-chart-3/20 text-chart-3",
    },
    { label: "New members", value: recentMembers.length, hint: "Last 10 days", icon: Sparkles, href: "#new-members", tone: "bg-chart-2/20 text-primary" },
  ];

  return (
    <div className={GRID}>
      {tiles.map(({ label, value, hint, icon: Icon, href, tone }) => (
        <Link
          key={label}
          href={href}
          className="group rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Card className="h-full flex-row items-center gap-3 p-4 transition-colors group-hover:border-primary/40">
            <span
              className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl leading-tight font-semibold tabular-nums">{value}</p>
              <p className="truncate text-xs text-muted-foreground">{hint}</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function SnapshotStatsSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex-row items-center gap-3 p-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-6 w-10" />
          </div>
        </Card>
      ))}
    </div>
  );
}
