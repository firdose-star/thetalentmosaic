"use client";

/**
 * Community metrics: six compact tiles, each computed from the
 * underlying records and each clicking through to the list behind it.
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

import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OverviewSummary } from "../types";

const GRID =
  "grid grid-cols-2 gap-3 @2xl/main:grid-cols-3 @6xl/main:grid-cols-6";

interface Tile {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  href: string;
  /** Tint for the icon chip — semantic accents, not decoration. */
  tone: string;
}

const COMMUNITY = "bg-accent text-primary";

export function SnapshotStats({ summary }: { summary: OverviewSummary }) {
  const { totals, recentMembers } = summary;

  const birthdayCount = summary.birthdays.today.length + summary.birthdays.upcoming.length;

  const tiles: Tile[] = [
    { label: "Total Community Members", value: totals.members, hint: "Approved members", icon: Users, href: ROUTES.people, tone: COMMUNITY },
    { label: "Startups", value: totals.startups, hint: "Unique startups", icon: Building2, href: `${ROUTES.people}#filters`, tone: COMMUNITY },
    { label: "Cities", value: totals.cities, hint: "Where members are based", icon: MapPin, href: `${ROUTES.people}#filters`, tone: COMMUNITY },
    { label: "Seniority", value: totals.seniorityLevels, hint: "Levels represented", icon: Compass, href: "#makeup", tone: COMMUNITY },
    { label: "Birthday", value: birthdayCount, hint: `${summary.birthdays.today.length} today, ${summary.birthdays.upcoming.length} coming up`, icon: Cake, href: "#birthdays", tone: "bg-chart-3/20 text-chart-3" },
    { label: "New Members", value: recentMembers.length, hint: "Members who joined us recently", icon: Sparkles, href: "#new-members", tone: "bg-chart-2/20 text-primary" },
  ];

  return (
    <Stagger className={GRID}>
      {tiles.map(({ label, value, hint, icon: Icon, href, tone }) => (
        <StaggerItem key={label} whileHover={{ y: -2 }}>
          <Link
            href={href}
            className="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
        </StaggerItem>
      ))}
    </Stagger>
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
