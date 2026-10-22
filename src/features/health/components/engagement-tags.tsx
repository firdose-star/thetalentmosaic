"use client";

/**
 * Engagement tags (PRD §7): every member's tier — connected online only,
 * attended 1–2 events, or a regular (3+) — which events they attended, and
 * custom tags like Speaker or Volunteer. Admins tick events attended and
 * edit tags; counts and tiers update live.
 */
import { Pencil, Plus, Tag } from "lucide-react";
import { useState } from "react";

import { ResultCount, SearchInput } from "@/components/shared/filter-bar";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { ErrorState, TableSkeleton } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortDate } from "@/lib/community";
import { cn } from "@/lib/utils";
import { useEngagementTags, useUpdateEngagement } from "../hooks/use-health";
import { CUSTOM_TAGS, type EngagementTier } from "../services/health.service";

const TIER_TONE: Record<EngagementTier, string> = {
  "Connected online only": "bg-chart-4/20 text-foreground",
  "Attended 1–2 events": "bg-chart-2/20 text-foreground",
  "Regulars (3+ events)": "bg-primary text-primary-foreground",
};

type TagsData = NonNullable<ReturnType<typeof useEngagementTags>["data"]>;
type MemberRow = TagsData["members"][number];

function EditEngagementDialog({ member, events }: { member: MemberRow; events: TagsData["events"] }) {
  const update = useUpdateEngagement();
  const [open, setOpen] = useState(false);
  const [attended, setAttended] = useState(member.eventsAttended.map((e) => e.id));
  const [tags, setTags] = useState(member.tags);
  const [custom, setCustom] = useState("");
  const allTags = [...new Set([...CUSTOM_TAGS, ...tags])];

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <Pencil data-icon="inline-start" />
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member.name}</DialogTitle>
          <DialogDescription>Tick the events they attended and tag how they’re engaged.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Events attended ({attended.length})</p>
          <ul className="flex max-h-56 flex-col overflow-y-auto rounded-lg border p-1">
            {events.map((e) => (
              <li key={e.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
                  <Checkbox checked={attended.includes(e.id)} onCheckedChange={() => setAttended((a) => toggle(a, e.id))} />
                  <span className="flex-1 text-sm">{e.title}</span>
                  <span className="text-xs text-muted-foreground">{shortDate(e.date, true)} · {e.city}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags((t) => toggle(t, tag))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a custom tag" aria-label="Custom tag" />
            <Button
              variant="outline"
              onClick={() => {
                const value = custom.trim();
                if (value && !tags.includes(value)) setTags((t) => [...t, value]);
                setCustom("");
              }}
            >
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={update.isPending}
            onClick={() =>
              update.mutate({ memberId: member.id, eventsAttended: attended, tags }, { onSuccess: () => setOpen(false) })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EngagementTags() {
  const { data, isPending, isError, error, refetch } = useEngagementTags();
  const [filter, setFilter] = useState<string>("");
  const [query, setQuery] = useState("");

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <TableSkeleton />;

  const q = query.trim().toLowerCase();
  const rows = data.members.filter(
    (m) =>
      (!filter || m.tier === filter || m.tags.includes(filter)) &&
      (!q || `${m.name} ${m.startup}`.toLowerCase().includes(q)),
  );

  const chip = (key: string, label: string, count: number, tone?: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter((f) => (f === key ? "" : key))}
      aria-pressed={filter === key}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors hover:border-primary/40",
        filter === key && "border-primary ring-2 ring-primary/30",
      )}
    >
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tone ?? "bg-muted")}>{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{count}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 @3xl/main:grid-cols-4 @6xl/main:grid-cols-8">
        {data.tierCounts.map((t) => chip(t.tier, t.tier, t.count, TIER_TONE[t.tier]))}
        {data.tagCounts.map((t) => chip(t.tag, t.tag, t.count))}
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Search members" />
      <ResultCount count={rows.length} noun={["member", "members"]} />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Engagement</TableHead>
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
                <TableCell>
                  <Badge className={TIER_TONE[m.tier]}>{m.tier}</Badge>
                </TableCell>
                <TableCell className="max-w-80 whitespace-normal">
                  {m.eventsAttended.length === 0 ? (
                    <span className="text-xs text-muted-foreground">None yet</span>
                  ) : (
                    <span className="text-xs">
                      <span className="font-semibold">{m.eventsAttended.length}</span>
                      <span className="text-muted-foreground"> · {m.eventsAttended.map((e) => e.title).join(", ")}</span>
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {m.tags.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      m.tags.map((t) => (
                        <Badge key={t} variant="outline" className="gap-1"><Tag className="size-3" />{t}</Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <EditEngagementDialog member={m} events={data.events} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
