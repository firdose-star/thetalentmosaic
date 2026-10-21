"use client";

/**
 * The Overview body: one summary query, every panel rendered from it, with the
 * loading and error states every list needs (PRD §5).
 *
 * Layout: welcome band → KPI row → two columns. The main column holds the
 * community picture (makeup, events, roles, and the admin chart); the right
 * rail holds the people lists and the contact card.
 */
import { RoleGuard } from "@/components/shared/role-guard";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { useOverviewSummary } from "../hooks/use-overview";
import { AttentionBar } from "./attention-bar";
import { CommunityMakeup, NewMembersChart } from "./community-insights";
import { CommunitySearch } from "./community-search";
import { LatestRolesPanel, UpcomingEventsPanel } from "./events-and-roles";
import { HaveQuestions } from "./have-questions";
import { BirthdaysPanel, RecentMembersPanel } from "./member-lists";
import { SnapshotStats, SnapshotStatsSkeleton } from "./snapshot-stats";

export function OverviewDashboard() {
  const { data, isPending, isError, error, refetch } = useOverviewSummary();

  return (
    <>
      <CommunitySearch />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <>
          <SnapshotStatsSkeleton />
          <LoadingState className="min-h-64" />
        </>
      ) : (
        <>
          <RoleGuard allow={["admin"]}>
            <AttentionBar attention={data.attention} />
          </RoleGuard>

          <SnapshotStats summary={data} />

          <div className="grid items-start gap-4 @5xl/main:grid-cols-[minmax(0,1fr)_22rem] @7xl/main:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex min-w-0 flex-col gap-4">
              <CommunityMakeup summary={data} />
              <div className="grid gap-4 @3xl/main:grid-cols-2">
                <UpcomingEventsPanel
                  events={data.nextEvents}
                  total={data.totals.upcomingEvents}
                />
                <LatestRolesPanel
                  roles={data.latestRoles}
                  total={data.totals.activeOpportunities}
                />
              </div>
              <RoleGuard allow={["admin"]}>
                <NewMembersChart monthlyJoins={data.monthlyJoins} />
              </RoleGuard>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <BirthdaysPanel birthdays={data.birthdays} />
              <RecentMembersPanel members={data.recentMembers} asOf={data.asOf} />
              <HaveQuestions />
            </div>
          </div>
        </>
      )}
    </>
  );
}
