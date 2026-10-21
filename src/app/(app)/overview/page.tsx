/**
 * `/overview` — a quick snapshot of the Community (PRD §6.1).
 *
 * Server Component: a header plus the client dashboard from the feature slice.
 */
import { PageHeader } from "@/components/shared/page-header";
import { OverviewDashboard } from "@/features/overview";

export const metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Here’s a quick snapshot of the Community."
      />
      <OverviewDashboard />
    </>
  );
}
