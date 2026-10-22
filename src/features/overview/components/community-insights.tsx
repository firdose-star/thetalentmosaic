"use client";

/**
 * Community makeup — seniority, cities and experience side by side in one
 * card — and, for admins only (PRD §3), new members over time.
 */
import Link from "next/link";
import { useState } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { shortDate } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OverviewSummary } from "../types";
import { BarList } from "./bar-list";

const SENIORITY_COLOURS = [
  "bg-chart-5",
  "bg-chart-2",
  "bg-chart-1",
  "bg-chart-3",
  "bg-chart-4",
];

const filterHref = (key: string, value: string) =>
  `${ROUTES.people}?${key}=${encodeURIComponent(value)}`;

function Heading({ children, className }: { children: string; className?: string }) {
  return (
    <h3
      className={cn(
        "mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function CommunityMakeup({ summary }: { summary: OverviewSummary }) {
  const { seniority } = summary;

  return (
    <Section
      title="Community makeup"
      description="Who is in the community. Tap any row to see the members behind it."
    >
      <div id="makeup" className="grid scroll-mt-20 gap-6 @3xl/main:grid-cols-3">
        <div>
          <Heading>Seniority</Heading>
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {seniority.map((s, i) => (
              <span
                key={s.level}
                className={SENIORITY_COLOURS[i % SENIORITY_COLOURS.length]}
                style={{ flex: s.count }}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {seniority.map((s, i) => (
              <li key={s.level}>
                <Link
                  href={filterHref("seniority", s.level)}
                  className="flex items-center gap-2 rounded-md py-1 text-sm hover:text-primary"
                >
                  <span
                    className={`size-2.5 rounded-full ${SENIORITY_COLOURS[i % SENIORITY_COLOURS.length]}`}
                    aria-hidden
                  />
                  {s.level}
                  <span className="ml-auto font-semibold tabular-nums">{s.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Heading>Cities with the most members</Heading>
          <BarList
            rows={summary.cities.slice(0, 5).map((c) => ({
              label: c.city,
              value: c.count,
              href: filterHref("city", c.city),
            }))}
          />
        </div>

        <div>
          <Heading>Breakdown by experience</Heading>
          <BarList
            rows={summary.experience.map((e) => ({
              label: e.band,
              value: e.count,
              href: filterHref("experience", e.band),
            }))}
          />
        </div>
      </div>
    </Section>
  );
}

/**
 * Admin only — render inside `<RoleGuard allow={["admin"]}>`. Tap a month to
 * see exactly who joined.
 */
export function NewMembersChart({
  monthlyJoins,
}: {
  monthlyJoins: OverviewSummary["monthlyJoins"];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const max = Math.max(...monthlyJoins.map((m) => m.count), 1);
  const month = monthlyJoins.find((m) => m.key === selected);

  return (
    <Section
      title="New members over time"
      description="Joined per month, from approval dates. Tap a month to see who joined."
      actions={<Badge variant="secondary">Admin only</Badge>}
    >
      <div className="flex h-44 items-end gap-2">
        {monthlyJoins.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSelected(selected === m.key ? null : m.key)}
            aria-pressed={selected === m.key}
            aria-label={`${m.label}: ${m.count} joined`}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-xs font-semibold tabular-nums">{m.count}</span>
            <span
              className={cn(
                "w-full max-w-12 rounded-t-md bg-chart-2 transition-colors group-hover:bg-primary",
                selected === m.key && "bg-primary",
              )}
              style={{ height: `${Math.max(4, (m.count / max) * 100)}%` }}
            />
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </button>
        ))}
      </div>

      {month && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="text-base font-semibold text-foreground">{month.count}</span>{" "}
            {month.count === 1 ? "member" : "members"} joined in {month.label}
          </p>
          {month.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody joined this month.</p>
          ) : (
            <ul className="grid gap-2 @3xl/main:grid-cols-2 @6xl/main:grid-cols-3">
              {month.members.map((m) => (
                <li key={m.id}>
                  <Link href={`${ROUTES.people}/${m.id}`} className="flex items-center gap-3 rounded-lg border p-2 hover:border-primary/40">
                    <MemberAvatar name={m.name} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{m.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{m.designation}, {m.startup}</span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{shortDate(m.joinedOn)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}
