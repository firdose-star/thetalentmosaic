"use client";

/**
 * Community makeup — seniority, cities and experience side by side in one
 * card — and, for admins only (PRD §3), new members over time.
 */
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const joinsConfig = {
  count: { label: "Joined", color: "var(--chart-2)" },
} satisfies ChartConfig;

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

        <Tabs defaultValue="role">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Heading className="mb-0">Breakdown</Heading>
            <TabsList className="h-7">
              <TabsTrigger value="role" className="px-2 text-xs">Role</TabsTrigger>
              <TabsTrigger value="startup" className="px-2 text-xs">Startup</TabsTrigger>
              <TabsTrigger value="experience" className="px-2 text-xs">Experience</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="role">
            <BarList
              rows={summary.hrFunctions.slice(0, 5).map((f) => ({
                label: f.name,
                value: f.count,
                href: filterHref("function", f.name),
              }))}
            />
          </TabsContent>
          <TabsContent value="startup">
            <BarList
              rows={summary.startups.slice(0, 5).map((s) => ({
                label: s.name,
                value: s.count,
                href: filterHref("startup", s.name),
              }))}
            />
          </TabsContent>
          <TabsContent value="experience">
            <BarList
              rows={summary.experience.map((e) => ({
                label: e.band,
                value: e.count,
                href: filterHref("experience", e.band),
              }))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Section>
  );
}

/** Admin only — render inside `<RoleGuard allow={["admin"]}>`. */
export function NewMembersChart({
  monthlyJoins,
}: {
  monthlyJoins: OverviewSummary["monthlyJoins"];
}) {
  return (
    <Section
      title="New members over time"
      description="Joined per month, from approval dates."
      actions={<Badge variant="secondary">Admin only</Badge>}
    >
      <ChartContainer config={joinsConfig} className="h-44 w-full">
        <BarChart data={monthlyJoins} margin={{ left: 0, right: 0, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 2, 2]} />
        </BarChart>
      </ChartContainer>
    </Section>
  );
}
