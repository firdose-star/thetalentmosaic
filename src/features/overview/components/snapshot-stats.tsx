"use client";

/**
 * The KPI row. Every card is clickable (PRD §6.1) — it opens the list behind
 * the number.
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

import { StatCard } from "@/components/shared/stat-card";
import { ROUTES } from "@/lib/constants";
import type { OverviewSummary } from "../types";

export function SnapshotStats({ summary }: { summary: OverviewSummary }) {
  const { totals, birthdays, recentMembers } = summary;
  const birthdayCount = birthdays.today.length + birthdays.upcoming.length;

  const stats: { label: string; value: number; hint: string; icon: LucideIcon; href: string }[] = [
    { label: "Total members", value: totals.members, hint: "Approved members", icon: Users, href: ROUTES.people },
    { label: "Startups", value: totals.startups, hint: "Unique startups", icon: Building2, href: ROUTES.people },
    { label: "Cities", value: totals.cities, hint: "Where members are based", icon: MapPin, href: ROUTES.people },
    { label: "Seniority", value: totals.seniorityLevels, hint: "Levels represented", icon: Compass, href: ROUTES.people },
    {
      label: "Birthdays",
      value: birthdayCount,
      hint: `${birthdays.today.length} today, ${birthdays.upcoming.length} coming up`,
      icon: Cake,
      href: "#birthdays",
    },
    { label: "New members", value: recentMembers.length, hint: "Joined in the last 10 days", icon: Sparkles, href: "#new-members" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 @md/main:grid-cols-2 @4xl/main:grid-cols-3 @7xl/main:grid-cols-6">
      {stats.map(({ href, ...stat }) => (
        <Link
          key={stat.label}
          href={href}
          className="group rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <StatCard
            {...stat}
            className="h-full transition-colors group-hover:border-primary/40"
          />
        </Link>
      ))}
    </div>
  );
}
