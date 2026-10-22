"use client";

/**
 * Health › Events & Participation: reach, repeat versus first-time,
 * never-attended, participation by segment and per event — plus who
 * attended which events, with tiers and tags the admin can edit.
 */
import { Tag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SearchInput } from "@/components/shared/filter-bar";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shortDate } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { bySegment, groupCount, pct } from "../metrics";
import type { HealthData, HealthMember } from "../services/health.service";
import { CountLine, DetailsToggle } from "./health-parts";
import { DEFAULT_TAGS, EngagementEditor } from "./engagement-editor";

const TIERS = [
  { key: "online", label: "Connected online only", test: (m: HealthMember) => m.eventsAttended.length === 0, tone: "bg-chart-4/20 text-foreground" },
  { key: "some", label: "Attended 1–2 events", test: (m: HealthMember) => m.eventsAttended.length >= 1 && m.eventsAttended.length <= 2, tone: "bg-chart-2/20 text-foreground" },
  { key: "regular", label: "Regulars (3+ events)", test: (m: HealthMember) => m.eventsAttended.length >= 3, tone: "bg-primary text-primary-foreground" },
];

export function EventsTab({ data, list }: { data: HealthData; list: HealthMember[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [segment, setSegment] = useState<"City" | "Startup" | "Seniority">("City");
  const [query, setQuery] = useState("");
  const total = list.length;
  const attendances = list.reduce((sum, m) => sum + m.eventsAttended.length, 0);
  const reach = list.filter((m) => m.eventsAttended.length > 0);
  const tags = [...new Set([...DEFAULT_TAGS, ...list.flatMap((m) => m.tags)])];

  const filters = [
    ...TIERS.map((t) => ({ key: t.key, label: t.label, tone: t.tone, members: list.filter(t.test) })),
    ...tags.map((tag) => ({ key: `tag:${tag}`, label: tag, tone: "bg-muted", members: list.filter((m) => m.tags.includes(tag)) })),
  ];
  const active = filters.find((f) => f.key === filter);
  const q = query.trim().toLowerCase();
  const rows = (active ? active.members : list).filter((m) => !q || `${m.name} ${m.startup}`.toLowerCase().includes(q));
  const tierOf = (m: HealthMember) => TIERS.find((t) => t.test(m))!;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 @3xl/main:grid-cols-4">
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Community reach</p>
          <p className="text-2xl font-semibold tabular-nums">{reach.length}<span className="text-sm font-normal text-muted-foreground">/{total}</span></p>
          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{pct(reach.length, total)}</span> attended at least one event</p>
          <DetailsToggle>Unique members who attended at least one event ÷ members in view.</DetailsToggle>
        </Card>
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Total attendances</p>
          <p className="text-2xl font-semibold tabular-nums">{attendances}</p>
          <p className="text-xs text-muted-foreground">{(attendances / Math.max(reach.length, 1)).toFixed(1)} events per attendee</p>
          <DetailsToggle>Every attendance across all events. One person at three events is three attendances but one unique attendee.</DetailsToggle>
        </Card>
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Repeat vs first-time</p>
          <p className="text-2xl font-semibold tabular-nums">
            {list.filter((m) => m.eventsAttended.length >= 2).length}
            <span className="text-sm font-normal text-muted-foreground"> vs {list.filter((m) => m.eventsAttended.length === 1).length}</span>
          </p>
          <p className="text-xs text-muted-foreground">2+ events vs exactly one</p>
          <DetailsToggle>Repeat: members with two or more attended events. First-time: exactly one.</DetailsToggle>
        </Card>
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Never attended</p>
          <p className="text-2xl font-semibold tabular-nums">{total - reach.length}<span className="text-sm font-normal text-muted-foreground">/{total}</span></p>
          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{pct(total - reach.length, total)}</span> connected online only</p>
          <DetailsToggle>Members with no recorded attendance ÷ members in view.</DetailsToggle>
        </Card>
      </div>

      <div className="grid items-start gap-4 @4xl/main:grid-cols-2">
        <Section
          title="Participation by segment"
          description="Members who attended at least once ÷ members in that segment."
          actions={
            <Tabs value={segment} onValueChange={(v) => setSegment(v as typeof segment)}>
              <TabsList className="h-7">
                {(["City", "Startup", "Seniority"] as const).map((k) => (
                  <TabsTrigger key={k} value={k} className="px-2 text-xs">{k}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        >
          <ul className="flex flex-col gap-2">
            {groupCount(list, bySegment[segment]).map((g) => {
              const went = g.members.filter((m) => m.eventsAttended.length > 0).length;
              return (
                <li key={g.label} className="grid grid-cols-[8rem_1fr_6rem] items-center gap-3 text-sm">
                  <span className="truncate">{g.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-chart-2" style={{ width: `${(went / g.members.length) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{went}/{g.members.length} <span className="text-xs text-muted-foreground">{pct(went, g.members.length)}</span></span>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="By event" description="Members in this view who attended each catchup.">
          <ul className="flex max-h-80 flex-col divide-y overflow-y-auto">
            {data.events.map((e) => {
              const n = list.filter((m) => m.eventsAttended.includes(e.id)).length;
              return (
                <li key={e.id} className="flex items-center gap-3 py-2 text-sm first:pt-0">
                  <span className="flex-1">
                    <Link href={`${ROUTES.events}/${e.id}`} className="font-medium hover:underline">{e.title}</Link>
                    <span className="block text-xs text-muted-foreground">{shortDate(e.date, true)} · {e.city}</span>
                  </span>
                  <span className="tabular-nums">{n} <span className="text-xs text-muted-foreground">· {pct(n, total)}</span></span>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <Section title="Who attended what" description="Tap a tier or tag to filter. Admins can tick events attended and edit tags for any member.">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(filter === f.key ? null : f.key)}
                aria-pressed={filter === f.key}
                className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary/40", filter === f.key && "border-primary ring-2 ring-primary/25")}
              >
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", f.tone)}>{f.label}</span>
                <span className="font-semibold tabular-nums">{f.members.length}</span>
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search members" />
          <CountLine count={rows.length} total={total} label={active?.label} />
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Events attended</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <MemberAvatar name={m.name} className="size-7" />
                        <span>
                          <span className="block font-medium">{m.name}</span>
                          <span className="block text-xs text-muted-foreground">{m.startup}</span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell><Badge className={tierOf(m).tone}>{tierOf(m).label}</Badge></TableCell>
                    <TableCell className="max-w-80 text-xs whitespace-normal">
                      {m.eventsAttended.length === 0 ? (
                        <span className="text-muted-foreground">None yet</span>
                      ) : (
                        <>
                          <span className="font-semibold">{m.eventsAttended.length}</span>
                          <span className="text-muted-foreground">
                            {" "}· {m.eventsAttended.map((id) => data.events.find((e) => e.id === id)?.title ?? id).join(", ")}
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.tags.length === 0 ? <span className="text-xs text-muted-foreground">—</span> : m.tags.map((t) => (
                          <Badge key={t} variant="outline" className="gap-1"><Tag className="size-3" />{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <EngagementEditor memberId={m.id} memberName={m.name} eventsAttended={m.eventsAttended} tags={m.tags} events={data.events} knownTags={tags} label="Edit" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </Section>
    </div>
  );
}
