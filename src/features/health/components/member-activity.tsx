"use client";

/**
 * Member activity: who is active, with each member's last login date and
 * time. Filter by status or search by name.
 */
import Link from "next/link";
import { useState } from "react";

import { FilterSelect, ResultCount, SearchInput } from "@/components/shared/filter-bar";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { ErrorState, TableSkeleton } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useMemberActivity } from "../hooks/use-health";
import type { ActivityStatus } from "../services/health.service";

const STATUSES: ActivityStatus[] = ["Active this week", "Active this month", "Inactive 30+ days", "Never logged in"];

const STATUS_TONE: Record<ActivityStatus, string> = {
  "Active this week": "bg-accent text-primary",
  "Active this month": "bg-chart-2/15 text-foreground",
  "Inactive 30+ days": "bg-chart-3/20 text-foreground",
  "Never logged in": "bg-destructive/10 text-destructive",
};

function lastLogin(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MemberActivity() {
  const { data, isPending, isError, error, refetch } = useMemberActivity();
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <TableSkeleton />;

  const q = query.trim().toLowerCase();
  const rows = data.filter(
    (r) => (!status || r.status === status) && (!q || `${r.name} ${r.startup}`.toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 @2xl/main:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Search members" className="flex-1" />
        <div className="@2xl/main:w-60">
          <FilterSelect label="Status" allLabel="All statuses" value={status} options={STATUSES} onChange={setStatus} />
        </div>
      </div>
      <ResultCount count={rows.length} noun={["member", "members"]} />
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Events attended</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`${ROUTES.people}/${r.id}`} className="flex items-center gap-2.5 hover:underline">
                    <MemberAvatar name={r.name} className="size-7" />
                    <span>
                      <span className="block font-medium">{r.name}</span>
                      <span className="block text-xs text-muted-foreground">{r.startup} · {r.city}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{lastLogin(r.lastLoginAt)}</TableCell>
                <TableCell>
                  <Badge className={cn(STATUS_TONE[r.status])}>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.eventsAttended}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
