/**
 * `/opportunities` — the HR job board (spec §8).
 */
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { JobBoard } from "@/features/opportunities";

export const metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return (
    <>
      <PageHeader
        title="Roles for you!"
        description="Here are some opportunities that might be of interest"
      />
      <Suspense fallback={<LoadingState className="min-h-64" />}>
        <JobBoard />
      </Suspense>
    </>
  );
}
