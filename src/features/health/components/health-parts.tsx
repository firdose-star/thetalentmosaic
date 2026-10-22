"use client";

/**
 * Shared building blocks for every Community Health tab:
 *  - MetricCard: "n / total" with the live percentage and a Details toggle.
 *  - CountLine:  "12 members · 20.0% of the 60 in this view".
 *  - MemberTable: the members behind a number, with owner dropdowns and
 *    quick actions.
 */
import { ChevronDown, Clock, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { shortDate } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useHealthActions } from "../hooks/use-health";
import { pct, status, type Metric, type Tone } from "../metrics";
import type { HealthData, HealthMember } from "../services/health.service";
import { LogInteractionDialog } from "./log-interaction-dialog";

export const TONE: Record<Tone, string> = {
  ok: "bg-accent text-primary",
  warn: "bg-chart-3/20 text-foreground",
  bad: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

/** Expandable "Details" — how a number is calculated. */
export function DetailsToggle({ children, className }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border-t border-dashed pt-2", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
      >
        Details
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-1.5 text-xs text-muted-foreground">{children}</div>}
    </div>
  );
}

export function MetricCard({
  metric,
  total,
  selected,
  onSelect,
}: {
  metric: Metric;
  total: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const n = metric.members.length;
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.()}
      aria-pressed={selected}
      className={cn(
        "cursor-pointer gap-1 p-4 transition-colors outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected && "border-primary ring-2 ring-primary/25",
      )}
    >
      <p className="text-xs text-muted-foreground">{metric.label}</p>
      <p className="text-2xl font-semibold tabular-nums">
        {n}
        <span className="text-sm font-normal text-muted-foreground">/{total}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{pct(n, total)}</span> · {metric.sub}
      </p>
      <DetailsToggle className="mt-1">{metric.calc}</DetailsToggle>
    </Card>
  );
}

export function CountLine({ count, total, label }: { count: number; total: number; label?: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="text-base font-semibold text-foreground tabular-nums">{count}</span>{" "}
      {count === 1 ? "member" : "members"}
      {label ? <> · {label}</> : null} · {pct(count, total)} of the {total} in this view
    </p>
  );
}

export function OwnerSelect({ member, owners }: { member: HealthMember; owners: string[] }) {
  const { setOwner } = useHealthActions();
  return (
    <NativeSelect
      size="sm"
      aria-label={`Owner for ${member.name}`}
      value={member.owner ?? ""}
      onChange={(e) => setOwner.mutate({ memberId: member.id, owner: e.target.value || null })}
      className="w-36"
    >
      <NativeSelectOption value="">Unassigned</NativeSelectOption>
      {owners.map((o) => (
        <NativeSelectOption key={o} value={o}>{o}</NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

export function StatusBadge({ member, data }: { member: HealthMember; data: HealthData }) {
  const s = status(member, data.settings);
  return <Badge className={TONE[s.tone]}>{s.label}</Badge>;
}

export function LastContact({ member }: { member: HealthMember }) {
  if (!member.lastMeaningful) {
    return (
      <span className="text-xs text-muted-foreground">
        Never
        {member.lastAttempt && <span className="block">Last attempt {shortDate(member.lastAttempt.date)}</span>}
      </span>
    );
  }
  const d = member.daysSinceContact ?? 0;
  return (
    <span className="text-xs">
      <span className="font-medium tabular-nums">{shortDate(member.lastMeaningful.date, true)}</span>
      <span className="block text-muted-foreground">
        {d === 0 ? "Today" : `${d} days ago`} · {member.lastMeaningful.type}
      </span>
      {member.lastAttempt && (
        <span className="block text-muted-foreground">Last attempt {shortDate(member.lastAttempt.date)}</span>
      )}
    </span>
  );
}

/** The members behind any number, with the count line and admin actions. */
export function MemberTable({
  members,
  total,
  data,
  title,
  outreach = false,
}: {
  members: HealthMember[];
  total: number;
  data: HealthData;
  title?: string;
  /** Adds Mark contacted and Snooze. */
  outreach?: boolean;
}) {
  const { user } = useAuth();
  const { markContacted, snooze } = useHealthActions();

  return (
    <div className="flex flex-col gap-2">
      <CountLine count={members.length} total={total} label={title} />
      {members.length === 0 ? (
        <EmptyState title="No members in this list" />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last meaningful contact</TableHead>
                <TableHead>Latest touchpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link href={`${ROUTES.people}/${m.id}`} className="flex items-center gap-2.5 hover:underline">
                      <MemberAvatar name={m.name} className="size-7" />
                      <span>
                        <span className="block font-medium">{m.name}</span>
                        <span className="block text-xs text-muted-foreground">{m.startup}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">{shortDate(m.joinedOn, true)}</TableCell>
                  <TableCell><LastContact member={m} /></TableCell>
                  <TableCell className="text-xs">
                    {m.latestTouch ? (
                      <>
                        <span className="block">{m.latestTouch.label}</span>
                        <span className="text-muted-foreground tabular-nums">{shortDate(m.latestTouch.date, true)}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge member={m} data={data} />
                    {m.followUpOverdue && <Badge className={cn("mt-1", TONE.bad)}>Follow-up overdue</Badge>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m.eventsAttended.length}</TableCell>
                  <TableCell><OwnerSelect member={m} owners={data.settings.owners} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <LogInteractionDialog memberId={m.id} memberName={m.name} settings={data.settings} asOf={data.asOf} size="xs" />
                      {outreach && (
                        <>
                          <Button size="xs" variant="outline" onClick={() => markContacted.mutate({ memberId: m.id, by: user?.name ?? "Admin" })}>
                            <PhoneCall data-icon="inline-start" />
                            Contacted
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => snooze.mutate({ memberId: m.id, days: 7 })}>
                            <Clock data-icon="inline-start" />
                            Snooze 7d
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
