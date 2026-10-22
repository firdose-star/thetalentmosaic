"use client";

/**
 * The Overview body: one summary query, every panel rendered from it, with the
 * loading and error states every list needs (PRD §5).
 *
 * Members get a discovery view (search, community picture, birthdays, new
 * members). Admins additionally get the operational layer: the attention
 * row, new members over time and birthday message approval.
 */
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { RoleGuard } from "@/components/shared/role-guard";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { useOverviewSummary } from "../hooks/use-overview";
import { AttentionBar } from "./attention-bar";
import { BirthdayMessages } from "./birthday-messages";
import { CommunityMakeup, NewMembersChart } from "./community-insights";
import { CommunitySearch } from "./community-search";
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

          <Stagger className="flex flex-col gap-4">
            <StaggerItem>
              <CommunityMakeup summary={data} />
            </StaggerItem>

            <RoleGuard allow={["admin"]}>
              <StaggerItem>
                <NewMembersChart monthlyJoins={data.monthlyJoins} />
              </StaggerItem>
            </RoleGuard>

            <StaggerItem className="grid items-start gap-4 @4xl/main:grid-cols-2">
              <BirthdaysPanel birthdays={data.birthdays} />
              <RecentMembersPanel members={data.recentMembers} asOf={data.asOf} />
            </StaggerItem>

            <RoleGuard allow={["admin"]}>
              <StaggerItem>
                <BirthdayMessages />
              </StaggerItem>
            </RoleGuard>

            <StaggerItem>
              <HaveQuestions />
            </StaggerItem>
          </Stagger>
        </>
      )}
    </>
  );
}
