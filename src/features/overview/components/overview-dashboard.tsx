"use client";

/**
 * The Overview body: one summary query, every panel rendered from it, with the
 * loading and error states every list needs (PRD §5).
 */
import { RoleGuard } from "@/components/shared/role-guard";
import { StatCardSkeleton } from "@/components/shared/stat-card";
import { ErrorState } from "@/components/shared/state-views";
import { useOverviewSummary } from "../hooks/use-overview";
import { AttentionBar } from "./attention-bar";
import { CommunityInsights, SeniorityMix } from "./community-insights";
import { CommunitySearch } from "./community-search";
import { HaveQuestions } from "./have-questions";
import { BirthdaysPanel, RecentMembersPanel } from "./member-lists";
import { SnapshotStats } from "./snapshot-stats";

export function OverviewDashboard() {
  const { data, isPending, isError, error, refetch } = useOverviewSummary();

  return (
    <>
      <CommunitySearch />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="grid grid-cols-1 gap-4 @md/main:grid-cols-2 @4xl/main:grid-cols-3 @7xl/main:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <RoleGuard allow={["admin"]}>
            <AttentionBar attention={data.attention} />
          </RoleGuard>
          <SnapshotStats summary={data} />
          <SeniorityMix seniority={data.seniority} />
          <CommunityInsights summary={data} />
          <BirthdaysPanel birthdays={data.birthdays} />
          <RecentMembersPanel members={data.recentMembers} asOf={data.asOf} />
        </>
      )}

      <HaveQuestions />
    </>
  );
}
