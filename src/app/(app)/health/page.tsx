import { HeartPulse } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Community Health" };

export default function HealthPage() {
  return (
    <>
      <PageHeader
        title="Community Health"
        description="Who is joining, who is connected, and whom to reach out to next."
      />
      <PlaceholderPanel
        icon={HeartPulse}
        title="Community Health is coming"
        description="The admin engagement dashboard, per PRD §8."
        todo={[
          "Eight summary cards with live denominators (n / total, %)",
          "Outreach and follow-up queue with owner filter",
          "Member engagement, activity timeline, events and owners tabs",
        ]}
      />
    </>
  );
}
