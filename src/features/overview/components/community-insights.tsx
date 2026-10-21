"use client";

/**
 * Community insights: seniority mix, top cities, experience bands, and — for
 * admins only (PRD §3) — new members over time.
 */
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { RoleGuard } from "@/components/shared/role-guard";
import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ROUTES } from "@/lib/constants";
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

const joinsConfig = {
  count: { label: "Joined", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function SeniorityMix({ seniority }: { seniority: OverviewSummary["seniority"] }) {
  return (
    <Section title="Seniority" description="Members across seniority levels.">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {seniority.map((s, i) => (
          <span
            key={s.level}
            className={SENIORITY_COLOURS[i % SENIORITY_COLOURS.length]}
            style={{ flex: s.count }}
          />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {seniority.map((s, i) => (
          <li key={s.level}>
            <Link
              href={filterHref("seniority", s.level)}
              className="inline-flex items-center gap-1.5 text-sm hover:underline"
            >
              <span
                className={`size-2.5 rounded-full ${SENIORITY_COLOURS[i % SENIORITY_COLOURS.length]}`}
                aria-hidden
              />
              {s.level}
              <span className="font-semibold tabular-nums">{s.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function CommunityInsights({ summary }: { summary: OverviewSummary }) {
  return (
    <div className="grid gap-4 @4xl/main:grid-cols-3">
      <Section title="Cities with the most members" description="Where members are based.">
        <BarList
          rows={summary.cities.slice(0, 6).map((c) => ({
            label: c.city,
            value: c.count,
            href: filterHref("city", c.city),
          }))}
        />
      </Section>

      <Section title="Breakdown by experience" description="Years in HR.">
        <BarList
          rows={summary.experience.map((e) => ({
            label: e.band,
            value: e.count,
            href: filterHref("experience", e.band),
          }))}
        />
      </Section>

      <RoleGuard allow={["admin"]}>
        <Section
          title="New members over time"
          description="Joined per month, from approval dates."
          actions={<Badge variant="secondary">Admin only</Badge>}
        >
          <ChartContainer config={joinsConfig} className="h-48 w-full">
            <BarChart data={summary.monthlyJoins} margin={{ left: 0, right: 0, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 2, 2]} />
            </BarChart>
          </ChartContainer>
        </Section>
      </RoleGuard>
    </div>
  );
}
