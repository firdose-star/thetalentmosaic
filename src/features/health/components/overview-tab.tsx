"use client";

/**
 * Health › Overview: growth, relationship engagement, platform activity,
 * event participation and members requiring attention. Every number is
 * "n / total (%)" for the current view and opens the members behind it.
 */
import { useState } from "react";

import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  attentionLists,
  bySegment,
  contactWindows,
  groupCount,
  interactionsByType,
  monthlyJoins,
  pct,
  summaryCards,
  type Metric,
} from "../metrics";
import type { HealthData, HealthMember } from "../services/health.service";
import { DetailsToggle, MemberTable, MetricCard } from "./health-parts";

type Props = { data: HealthData; list: HealthMember[]; scoped: boolean };

/** A row of metric cards; the selected one opens its members underneath. */
function MetricGroup({
  title,
  description,
  metrics,
  total,
  data,
  selected,
  onSelect,
  cols = "@3xl/main:grid-cols-4",
  extra,
}: {
  title: string;
  description: string;
  metrics: Metric[];
  total: number;
  data: HealthData;
  selected: string | null;
  onSelect: (key: string | null) => void;
  cols?: string;
  extra?: React.ReactNode;
}) {
  const open = metrics.find((m) => m.key === selected);
  return (
    <Section title={title} description={description}>
      <div className="flex flex-col gap-4">
        <div className={cn("grid grid-cols-1 gap-3 @xl/main:grid-cols-2", cols)}>
          {metrics.map((m) => (
            <MetricCard
              key={m.key}
              metric={m}
              total={total}
              selected={m.key === selected}
              onSelect={() => onSelect(m.key === selected ? null : m.key)}
            />
          ))}
        </div>
        {extra}
        {open && <MemberTable members={open.members} total={total} data={data} title={open.label} />}
      </div>
    </Section>
  );
}

/** Clickable horizontal bars — each opens its members. */
function BarRows({ rows, total, selected, onSelect }: { rows: Metric[]; total: number; selected: string | null; onSelect: (k: string | null) => void }) {
  const max = Math.max(...rows.map((r) => r.members.length), 1);
  return (
    <ul className="flex flex-col gap-1">
      {rows.map((r) => (
        <li key={r.key}>
          <button
            type="button"
            onClick={() => onSelect(selected === r.key ? null : r.key)}
            className={cn("grid w-full grid-cols-[8rem_1fr_5.5rem] items-center gap-3 rounded-md px-1 py-1 text-left text-sm hover:bg-accent/50", selected === r.key && "bg-accent")}
          >
            <span className="truncate">{r.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-chart-2" style={{ width: `${Math.max(4, (r.members.length / max) * 100)}%` }} />
            </span>
            <span className="text-right tabular-nums">
              <span className="font-semibold">{r.members.length}</span>
              <span className="text-xs text-muted-foreground"> · {pct(r.members.length, total)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, sub, children }: { label: string; value: string | number; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      {children}
    </div>
  );
}

export function OverviewTab({ data, list, scoped }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [segment, setSegment] = useState<keyof typeof bySegment>("City");
  const s = data.settings;
  const total = list.length;

  // Growth
  const months = monthlyJoins(list, data.asOf);
  const monthMetrics: Metric[] = months.map((m) => ({ key: `m-${m.key}`, label: m.label, sub: "Joined", calc: "", members: m.members }));
  const thisMonth = months.at(-1)?.members.length ?? 0;
  const lastMonth = months.at(-2)?.members.length ?? 0;
  const growth = total - thisMonth > 0 ? (thisMonth / (total - thisMonth)) * 100 : 0;
  const startups = new Set(list.map((m) => m.startup)).size;
  const segmentRows: Metric[] = groupCount(list, bySegment[segment]).map((g) => ({
    key: `seg-${segment}-${g.label}`,
    label: g.label,
    sub: segment,
    calc: "",
    members: g.members,
  }));
  const growthOpen = [...monthMetrics, ...segmentRows].find((m) => m.key === selected);

  // Relationship
  const noneIn90: Metric = {
    key: "none-90",
    label: `No interaction in ${s.thresholds.t3} days`,
    sub: "Including never contacted",
    calc: `Members with no meaningful interaction in the last ${s.thresholds.t3} days, or ever ÷ members in view.`,
    members: list.filter((m) => m.daysSinceContact === null || m.daysSinceContact > s.thresholds.t3),
  };
  const byType = interactionsByType(data.interactions, list, s.interactionTypes, 90, data.asOf);

  // Platform
  const platform: Metric[] = [
    { key: "p-30", label: "Logged in during the last 30 days", sub: "Platform active", calc: "Members with a successful login in the last 30 days ÷ members in view.", members: list.filter((m) => m.loginDaysAgo !== null && m.loginDaysAgo <= 30) },
    { key: "p-repeat", label: "Returned multiple times", sub: "2+ logins", calc: "Members with two or more successful logins since joining ÷ members in view.", members: list.filter((m) => m.loginCount >= 2) },
    { key: "p-never", label: "Never logged in", sub: "Invited, not yet in", calc: "Approved members with no successful login ÷ members in view.", members: list.filter((m) => !m.lastLoginAt) },
  ];

  // Events
  const attendances = list.reduce((sum, m) => sum + m.eventsAttended.length, 0);
  const events: Metric[] = [
    { key: "e-reach", label: "Unique members who attended", sub: "Community reach", calc: "Unique members with at least one recorded attendance ÷ members in view.", members: list.filter((m) => m.eventsAttended.length > 0) },
    { key: "e-first", label: "First-time attendees", sub: "Exactly one event", calc: "Members whose attendance record has exactly one event.", members: list.filter((m) => m.eventsAttended.length === 1) },
    { key: "e-repeat", label: "Repeat attendees", sub: "Two or more events", calc: "Members who attended two or more events.", members: list.filter((m) => m.eventsAttended.length >= 2) },
    { key: "e-never", label: "Never attended", sub: "Connected online only", calc: "Members with no recorded attendance.", members: list.filter((m) => m.eventsAttended.length === 0) },
  ];

  const groupProps = { total, data, selected, onSelect: setSelected };

  return (
    <div className="flex flex-col gap-4">
      <MetricGroup
        title="At a glance"
        description="The eight numbers that matter most. Tap any card to see the members behind it."
        metrics={summaryCards(list, s, data.asOf)}
        {...groupProps}
      />

      <Section title="Community growth" description="Who is joining the community.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 @3xl/main:grid-cols-5">
            <Stat label="Total approved members" value={total} sub={scoped ? "In this view" : "Whole community"} />
            <Stat label="New this month" value={thisMonth} sub={`${lastMonth} last month`} />
            <Stat label="Growth rate this month" value={`${growth.toFixed(1)}%`} sub="New ÷ members at month start" />
            <Stat label="Unique startups" value={startups} sub={`${(total / Math.max(startups, 1)).toFixed(1)} members per startup`}>
              <DetailsToggle>Distinct startup names across the {total} members in this view.</DetailsToggle>
            </Stat>
            <Stat label="Awaiting approval" value={scoped ? "—" : data.awaitingApproval} sub={scoped ? "Not assigned to owners yet" : "Registrations to review"} />
          </div>

          <div className="grid gap-4 @4xl/main:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">New members over time — tap a month</p>
              <div className="flex h-40 items-end gap-2">
                {months.map((m) => {
                  const key = `m-${m.key}`;
                  const max = Math.max(...months.map((x) => x.members.length), 1);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setSelected(selected === key ? null : key)}
                      aria-label={`${m.label}: ${m.members.length} joined`}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    >
                      <span className="text-xs font-semibold tabular-nums">{m.members.length}</span>
                      <span
                        className={cn("w-full max-w-10 rounded-t-md bg-chart-2 transition-colors hover:bg-primary", selected === key && "bg-primary")}
                        style={{ height: `${Math.max(4, (m.members.length / max) * 100)}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Members by</p>
                <Tabs value={segment} onValueChange={(v) => setSegment(v as keyof typeof bySegment)}>
                  <TabsList className="h-7">
                    {(["City", "Startup", "Experience"] as const).map((k) => (
                      <TabsTrigger key={k} value={k} className="px-2 text-xs">{k}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <BarRows rows={segmentRows.slice(0, 8)} total={total} selected={selected} onSelect={setSelected} />
            </div>
          </div>
          {growthOpen && <MemberTable members={growthOpen.members} total={total} data={data} title={`${growthOpen.sub}: ${growthOpen.label}`} />}
        </div>
      </Section>

      <MetricGroup
        title="Relationship engagement"
        description="How many members we have actually connected with. Only meaningful interactions count; attempts are tracked separately."
        metrics={[...contactWindows(list, s), noneIn90]}
        cols="@3xl/main:grid-cols-5"
        extra={
          <div className="rounded-xl border p-4">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Interactions in the last 90 days, by type</p>
            <div className="flex flex-wrap gap-2">
              {byType.map((t) => (
                <Badge key={t.type} variant="secondary" className="h-7 gap-1.5 px-3 text-sm">
                  {t.type} <span className="font-semibold tabular-nums">{t.count}</span>
                </Badge>
              ))}
            </div>
            <DetailsToggle className="mt-3">Every recorded interaction (meaningful or attempt) with a member in this view in the last 90 days.</DetailsToggle>
          </div>
        }
        {...groupProps}
      />

      <MetricGroup
        title="Platform engagement"
        description="Are members using the website? Kept separate from offline relationship engagement."
        metrics={platform}
        cols="@3xl/main:grid-cols-3"
        extra={<p className="text-xs text-muted-foreground">Profile views, resource downloads and registrations started appear here once analytics events are captured (PRD §12).</p>}
        {...groupProps}
      />

      <MetricGroup
        title="Event participation"
        description={`Are members showing up? ${attendances} attendances across all events — one person at three events counts once in reach.`}
        metrics={events}
        {...groupProps}
      />

      <MetricGroup
        title="Members requiring attention"
        description="Who to reach out to next."
        metrics={attentionLists(list, s)}
        cols="@3xl/main:grid-cols-3"
        {...groupProps}
      />
    </div>
  );
}
