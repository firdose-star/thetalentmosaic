"use client";

/**
 * Activity Logs (PRD §7, §11): who changed what and when — admin actions with
 * before → after, member actions and system events — append-only, live from
 * the records. Filter by actor type and date range, search, export as CSV.
 */
import { Download } from "lucide-react";
import { useState } from "react";

import { FilterSelect, ResultCount, SearchInput } from "@/components/shared/filter-bar";
import { Section } from "@/components/shared/section";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAdminData } from "../hooks/use-admin";
import type { AdminData } from "../services/admin.service";
import { whenText } from "./admin-parts";

const ACTOR_TONE = { Admin: "bg-accent text-primary", Member: "bg-chart-2/20 text-foreground", System: "bg-muted text-muted-foreground" };
const RANGES = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

/** Activity by hour of day — sign-ins plus logged actions, from the records. */
export function ActivityByHour({ data }: { data: AdminData }) {
  const hours = Array.from({ length: 24 }, () => 0);
  data.members.forEach((m) => m.lastLoginAt && hours[new Date(m.lastLoginAt).getHours()]++);
  data.log.forEach((e) => hours[new Date(e.at).getHours()]++);
  const max = Math.max(...hours, 1);
  const peak = hours.indexOf(max);
  const label = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

  return (
    <Section title="Activity by hour" description={`Sign-ins and actions across the day · busiest around ${label(peak)}.`}>
      <div className="flex h-24 items-end gap-0.5" role="img" aria-label={`Activity peaks around ${label(peak)}`}>
        {hours.map((n, h) => (
          <span
            key={h}
            title={`${label(h)}: ${n}`}
            className={cn("flex-1 rounded-t-sm bg-chart-2", h === peak && "bg-primary")}
            style={{ height: `${Math.max(3, (n / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.625rem] text-muted-foreground">
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
      </div>
    </Section>
  );
}

function exportCsv(rows: AdminData["log"]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    ["When", "Who", "Type", "Action", "On", "Change"].join(","),
    ...rows.map((r) => [new Date(r.at).toLocaleString("en-IN"), r.actor, r.actorType, r.action, r.object, r.change ?? ""].map(escape).join(",")),
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `talent-mosaic-activity-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ActivityLogs() {
  const { data, isPending, isError, error, refetch } = useAdminData();
  const [actor, setActor] = useState("");
  const [range, setRange] = useState("7");
  const [query, setQuery] = useState("");

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  // Anchored on the data's own "today" so render stays pure.
  const endOfToday = new Date(`${data.asOf}T23:59:59`).getTime();
  const since = endOfToday - Number(range || "3650") * 86_400_000;
  const q = query.trim().toLowerCase();
  const rows = data.log.filter(
    (e) =>
      (!actor || e.actorType === actor) &&
      new Date(e.at).getTime() >= since &&
      (!q || `${e.actor} ${e.action} ${e.object} ${e.change ?? ""}`.toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-4">
      <ActivityByHour data={data} />

      <Card className="gap-2 p-4 @3xl/main:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Search who, what or which record" className="flex-1" />
        <div className="grid grid-cols-2 gap-2 @3xl/main:w-96">
          <FilterSelect label="Who" allLabel="Everyone" value={actor} options={["Admin", "Member", "System"]} onChange={setActor} />
          <FilterSelect label="When" allLabel="All time" value={range} options={RANGES} onChange={setRange} />
        </div>
        <Button variant="outline" onClick={() => exportCsv(rows)}>
          <Download data-icon="inline-start" />
          Export CSV
        </Button>
      </Card>

      <ResultCount count={rows.length} noun={["entry", "entries"]} />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>On</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 200).map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{whenText(e.at)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Badge className={ACTOR_TONE[e.actorType]}>{e.actorType}</Badge>
                    <span className="font-medium">{e.actor}</span>
                  </span>
                </TableCell>
                <TableCell>{e.action}</TableCell>
                <TableCell className="max-w-72 whitespace-normal">{e.object}</TableCell>
                <TableCell className="max-w-72 text-xs whitespace-normal text-muted-foreground">{e.change ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {rows.length > 200 && <p className="text-xs text-muted-foreground">Showing the latest 200 — narrow the filters or export for the rest.</p>}
    </div>
  );
}
