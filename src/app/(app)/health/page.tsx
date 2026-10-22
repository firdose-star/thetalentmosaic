/**
 * `/health` — Community Health and Engagement (PRD §8). Admin only.
 */
import { PageHeader } from "@/components/shared/page-header";
import { HealthDashboard } from "@/features/health";

export const metadata = { title: "Community Health" };

export default function HealthPage() {
  return (
    <>
      <PageHeader
        title="Community Health"
        description="How many members use the platform, who is active, and how every member is engaged."
      />
      <HealthDashboard />
    </>
  );
}
