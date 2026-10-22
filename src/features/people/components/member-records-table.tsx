"use client";

/**
 * Admin-only member records (spec §6.6): every record with status, owner and
 * missing data, plus shortcuts to the review queues in Member Management.
 */
import { Copy, UserPlus } from "lucide-react";
import Link from "next/link";

import { ResultCount } from "@/components/shared/filter-bar";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { ErrorState, TableSkeleton } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { shortDate } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { MemberOwnerSelect } from "@/features/health";
import { useMemberRecords } from "../hooks/use-people";
import type { PeopleFilters } from "../types";

export function MemberRecordsTable({ filters }: { filters: PeopleFilters }) {
  const records = useMemberRecords(filters, true);

  if (records.isError) {
    return <ErrorState error={records.error} onRetry={() => void records.refetch()} />;
  }
  if (records.isPending) return <TableSkeleton />;

  const withGaps = records.data.filter((r) => r.missing.length > 0).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ResultCount count={records.data.length} noun={["record", "records"]} />
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{withGaps} with missing data</Badge>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={ROUTES.adminMembers} />}>
            <UserPlus data-icon="inline-start" />
            Review registrations
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={ROUTES.adminMembers} />}>
            <Copy data-icon="inline-start" />
            Check duplicates
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Missing data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`${ROUTES.people}/${r.id}`} className="flex items-center gap-2.5 hover:underline">
                    <MemberAvatar name={r.name} className="size-7" />
                    <span>
                      <span className="block font-medium">{r.name}</span>
                      <span className="block text-xs text-muted-foreground">{r.startup}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>{r.city}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "Active" ? "secondary" : "outline"}>{r.status}</Badge>
                </TableCell>
                <TableCell><MemberOwnerSelect memberId={r.id} memberName={r.name} /></TableCell>
                <TableCell className="tabular-nums">{shortDate(r.joinedOn, true)}</TableCell>
                <TableCell>
                  {r.missing.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Complete</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {r.missing.map((gap) => (
                        <Badge key={gap} variant="outline" className="border-chart-3/50 text-chart-3">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
