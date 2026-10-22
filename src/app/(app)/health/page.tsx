/**
 * `/health` — Community Health and Engagement (PRD §8). Admin only.
 */
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { HealthDashboard } from "@/features/health";

export const metadata = { title: "Community Health" };

export default function HealthPage() {
  return (
    <>
      <PageHeader
        title="Community Health"
        description="Who is joining, who we are connected with, who is drifting, and whom to reach out to next."
      />
      {/* The view and tab live in the URL (useSearchParams), so Suspense is required. */}
      <Suspense fallback={<LoadingState className="min-h-64" />}>
        <HealthDashboard />
      </Suspense>
    </>
  );
}
