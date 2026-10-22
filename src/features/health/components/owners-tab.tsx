"use client";

/**
 * Health › Relationship Owners: every owner side by side (plus the combined
 * view and Unassigned), then each owner's detail — how many members they
 * hold, at what engagement level, and each member's latest touchpoint (event,
 * call, WhatsApp, LinkedIn comment…) with its date.
 */
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortDate } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, ownerRows, pct, scopeMembers, status, type Scope } from "../metrics";
import type { HealthData } from "../services/health.service";
import { DetailsToggle, OwnerSelect, TONE } from "./health-parts";

const COLUMNS = [
  { key: "members", label: "Members" },
  { key: "recent", label: "Recently engaged" },
  { key: "never", label: "Never contacted" },
  { key: "due", label: "Follow-ups due" },
  { key: "risk", label: "At-risk" },
  { key: "reach", label: "Event reach" },
  { key: "coverage", label: "Coverage (90 days)" },
] as const;

function Ratio({ n, d }: { n: number; d: number }) {
  return (
    <span className="tabular-nums">
      <span className="block font-medium">{n}/{d}</span>
      <span className="text-xs text-muted-foreground">{pct(n, d)}</span>
    </span>
  );
}

function OwnerDetail({ data, owner }: { data: HealthData; owner: string }) {
  const members = scopeMembers(data.members, owner);
  const levels = STATUS_LABELS.map((label) => ({
    label,
    members: members.filter((m) => status(m, data.settings).label === label),
  })).filter((l) => l.members.length);
  const latest = [...members].sort((a, b) => (b.latestTouch?.date ?? "").localeCompare(a.latestTouch?.date ?? ""));

  return (
    <Section
      title={owner === "__none" ? "Unassigned members" : `${owner}’s members`}
      description={`${members.length} of ${data.members.length} community members (${pct(members.length, data.members.length)}).`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {levels.map((l) => {
            const tone = status(l.members[0], data.settings).tone;
            return (
              <Badge key={l.label} className={cn("h-7 gap-1.5 px-3 text-sm", TONE[tone])}>
                {l.label} <span className="font-semibold tabular-nums">{l.members.length}</span>
                <span className="text-xs opacity-75">· {pct(l.members.length, members.length)}</span>
              </Badge>
            );
          })}
        </div>
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Engagement level</TableHead>
                <TableHead>Latest engagement</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Last meaningful contact</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latest.map((m) => {
                const s = status(m, data.settings);
                return (
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
                    <TableCell><Badge className={TONE[s.tone]}>{s.label}</Badge></TableCell>
                    <TableCell className="text-sm">{m.latestTouch?.label ?? <span className="text-muted-foreground">No engagement yet</span>}</TableCell>
                    <TableCell className="text-sm tabular-nums">{m.latestTouch ? shortDate(m.latestTouch.date, true) : "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {m.lastMeaningful ? `${shortDate(m.lastMeaningful.date, true)} · ${m.lastMeaningful.type}` : "Never"}
                    </TableCell>
                    <TableCell><OwnerSelect member={m} owners={data.settings.owners} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Section>
  );
}

export function OwnersTab({ data, scope, onScope }: { data: HealthData; scope: Scope; onScope: (s: Scope) => void }) {
  const rows = ownerRows(data);

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Owners compared"
        description="Each owner's numbers use their own members as the denominator. Tap an owner to switch the whole dashboard to their view."
      >
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                {COLUMNS.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const d = r.members.length;
                return (
                  <TableRow key={r.scope || "all"} className={cn(scope === r.scope && "bg-accent/60")}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell><Ratio n={d} d={data.members.length} /></TableCell>
                    <TableCell><Ratio n={r.recent.length} d={d} /></TableCell>
                    <TableCell><Ratio n={r.never.length} d={d} /></TableCell>
                    <TableCell><Ratio n={r.due.length} d={d} /></TableCell>
                    <TableCell><Ratio n={r.risk.length} d={d} /></TableCell>
                    <TableCell><Ratio n={r.reach.length} d={d} /></TableCell>
                    <TableCell><Ratio n={r.coverage.length} d={d} /></TableCell>
                    <TableCell>
                      <Button size="xs" variant={scope === r.scope ? "default" : "ghost"} onClick={() => onScope(r.scope)}>
                        {scope === r.scope ? "Viewing" : "Open view"}
                        <ArrowRight data-icon="inline-end" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        <DetailsToggle className="mt-3">
          Members is out of the whole community; every other column is out of that owner’s members. Coverage is the
          share with a meaningful interaction in the last 90 days. Reassign owners from any member row, or manage the
          owner list in Settings & Data.
        </DetailsToggle>
      </Section>

      {scope ? (
        <OwnerDetail data={data} owner={scope} />
      ) : (
        data.settings.owners.map((owner) => <OwnerDetail key={owner} data={data} owner={owner} />)
      )}
    </div>
  );
}
