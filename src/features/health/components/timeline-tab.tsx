"use client";

/**
 * Health › Activity Timeline: pick any member to see their full history —
 * recorded interactions, events attended, joining, and planned or overdue
 * follow-ups — and log, edit or remove interactions.
 */
import { CalendarCheck, CircleDot, Sprout, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { MemberSince } from "@/components/shared/member-since";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { shortDate } from "@/lib/community";
import type { Interaction } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { useHealthActions } from "../hooks/use-health";
import type { HealthData, HealthMember } from "../services/health.service";
import { LastContact, OwnerSelect, StatusBadge } from "./health-parts";
import { LogInteractionDialog } from "./log-interaction-dialog";

interface Entry {
  key: string;
  date: string;
  title: string;
  detail: string;
  kind: "interaction" | "attempt" | "event" | "joined" | "follow-up";
  interaction?: Interaction;
}

function entriesFor(m: HealthMember, data: HealthData): Entry[] {
  const outcomes = new Map(data.settings.outcomes.map((o) => [o.key, o]));
  const list: Entry[] = data.interactions
    .filter((x) => x.memberId === m.id)
    .map((x) => {
      const outcome = outcomes.get(x.outcome);
      return {
        key: x.id,
        date: x.date,
        title: outcome?.meaningful ? x.type : `${x.type} · ${outcome?.label ?? x.outcome}`,
        detail: [x.notes, `Logged by ${x.loggedBy}`].filter(Boolean).join(" · "),
        kind: outcome?.meaningful ? "interaction" : "attempt",
        interaction: x,
      };
    });
  m.eventsAttended.forEach((id) => {
    const e = data.events.find((ev) => ev.id === id);
    if (e) list.push({ key: `ev-${id}`, date: e.date, title: "Event attended", detail: `${e.title} · ${e.city}`, kind: "event" });
  });
  list.push({ key: "joined", date: m.joinedOn, title: "Joined community", detail: "Membership approved", kind: "joined" });
  if (m.pendingFollowUp) {
    list.push({
      key: "fu",
      date: m.pendingFollowUp,
      title: m.followUpOverdue ? "Follow-up overdue" : "Follow-up planned",
      detail: "Promised follow-up",
      kind: "follow-up",
    });
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

const ICON = { interaction: CircleDot, attempt: CircleDot, event: CalendarCheck, joined: UserPlus, "follow-up": Sprout };
const DOT = {
  interaction: "bg-primary text-primary-foreground",
  attempt: "bg-muted text-muted-foreground",
  event: "bg-chart-2 text-foreground",
  joined: "bg-accent text-primary",
  "follow-up": "bg-chart-3 text-foreground",
};

export function TimelineTab({ data, list }: { data: HealthData; list: HealthMember[] }) {
  const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
  const [id, setId] = useState(sorted[0]?.id ?? "");
  const { deleteInteraction } = useHealthActions();
  const member = list.find((m) => m.id === id) ?? sorted[0];

  if (!member) return <EmptyState title="No members in this view" />;
  const entries = entriesFor(member, data);

  return (
    <div className="grid items-start gap-4 @4xl/main:grid-cols-[20rem_minmax(0,1fr)]">
      <Card className="gap-4 p-5">
        <NativeSelect aria-label="Member" value={member.id} onChange={(e) => setId(e.target.value)} className="w-full">
          {sorted.map((m) => (
            <NativeSelectOption key={m.id} value={m.id}>{m.name} · {m.startup}</NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="flex items-center gap-3">
          <MemberAvatar name={member.name} className="size-14" />
          <div className="min-w-0">
            <p className="font-semibold">{member.name}</p>
            <p className="truncate text-xs text-muted-foreground">{member.designation} · {member.city}</p>
            <MemberSince joinedOn={member.joinedOn} className="mt-1" />
          </div>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge member={member} data={data} /></dd></div>
          <div className="flex items-start justify-between gap-2"><dt className="text-muted-foreground">Last contact</dt><dd className="text-right"><LastContact member={member} /></dd></div>
          <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Events attended</dt><dd className="font-medium">{member.eventsAttended.length}</dd></div>
          <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">Owner</dt><dd><OwnerSelect member={member} owners={data.settings.owners} /></dd></div>
        </dl>
        <LogInteractionDialog memberId={member.id} memberName={member.name} settings={data.settings} asOf={data.asOf} />
      </Card>

      <Section title="Engagement history" description={`${entries.length} entries, newest first.`}>
        <ol className="relative flex flex-col gap-4 pl-8">
          <span aria-hidden className="absolute top-2 bottom-2 left-3 w-0.5 bg-border" />
          {entries.map((e) => {
            const Icon = ICON[e.kind];
            return (
              <li key={e.key} className="relative">
                <span className={cn("absolute top-0.5 -left-8 flex size-6 items-center justify-center rounded-full ring-4 ring-card", DOT[e.kind])}>
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground tabular-nums">{shortDate(e.date, true)}</p>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-muted-foreground">{e.detail}</p>
                  </div>
                  {e.kind === "attempt" && <Badge variant="outline">Attempt</Badge>}
                  {e.interaction && (
                    <div className="flex gap-1">
                      <LogInteractionDialog memberId={member.id} memberName={member.name} settings={data.settings} asOf={data.asOf} existing={e.interaction} />
                      <Button size="icon-xs" variant="ghost" aria-label="Remove interaction" onClick={() => deleteInteraction.mutate(e.interaction!.id)}>
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Section>
    </div>
  );
}
