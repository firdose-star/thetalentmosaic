"use client";

/**
 * Health › Outreach & Follow-ups: a prioritised queue built from the last
 * meaningful interaction. Each reminder carries the member, startup, last
 * interaction, days since contact and owner, with Log, Mark contacted,
 * Snooze and reassign right there.
 */
import { useState } from "react";

import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shortDate } from "@/lib/community";
import { cn } from "@/lib/utils";
import { useHealthActions } from "../hooks/use-health";
import { outreachGroups, pct } from "../metrics";
import type { HealthData, HealthMember } from "../services/health.service";
import { DetailsToggle, MemberTable } from "./health-parts";

export function OutreachTab({ data, list }: { data: HealthData; list: HealthMember[] }) {
  const groups = outreachGroups(list, data.settings);
  const [open, setOpen] = useState(groups.find((g) => g.members.length)?.key ?? groups[0].key);
  const { snooze } = useHealthActions();
  const snoozed = list.filter((m) => m.snoozedUntil);
  const active = groups.find((g) => g.key === open);
  const queued = groups.reduce((sum, g) => sum + g.members.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        <span className="text-base font-semibold text-foreground">{queued}</span> members in the queue ·{" "}
        {pct(queued, list.length)} of the {list.length} in this view. Each member appears once, under their most urgent reason.
      </p>

      <div className="grid grid-cols-2 gap-3 @3xl/main:grid-cols-3 @6xl/main:grid-cols-6">
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setOpen(g.key)}
            aria-pressed={open === g.key}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40",
              open === g.key && "border-primary ring-2 ring-primary/25",
            )}
          >
            <span className="text-xs text-muted-foreground">{g.label}</span>
            <span className="text-2xl font-semibold tabular-nums">
              {g.members.length}
              <span className="text-sm font-normal text-muted-foreground">/{list.length}</span>
            </span>
            <span className="text-xs text-muted-foreground">{g.action}</span>
          </button>
        ))}
      </div>

      {active && (
        <Section title={active.label} description={`Suggested action: ${active.action}.`}>
          <MemberTable members={active.members} total={list.length} data={data} outreach />
          <DetailsToggle className="mt-3">
            Reminders use the last meaningful interaction (attempts don’t reset the clock). Thresholds are{" "}
            {data.settings.thresholds.t1}, {data.settings.thresholds.t2} and {data.settings.thresholds.t3} days — change them in
            Settings & Data. Snoozed members leave the queue until the snooze ends; the weekly digest repeats
            overdue members until the action is done.
          </DetailsToggle>
        </Section>
      )}

      {snoozed.length > 0 && (
        <Section title="Snoozed" description={`${snoozed.length} members are paused from the queue.`}>
          <ul className="flex flex-col divide-y">
            {snoozed.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <span className="flex-1 text-sm">{m.name} <span className="text-muted-foreground">· {m.startup}</span></span>
                <Badge variant="outline">Until {shortDate(m.snoozedUntil ?? "")}</Badge>
                <Button size="xs" variant="ghost" onClick={() => snooze.mutate({ memberId: m.id, days: 0 })}>
                  Un-snooze
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
