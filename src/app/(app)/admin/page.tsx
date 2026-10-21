import { LayoutDashboard } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Admin Overview" };

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader
        title="Admin Overview"
        description="Community intelligence and everything that needs attention."
      />
      <PlaceholderPanel
        icon={LayoutDashboard}
        title="Admin Overview is coming"
        description="Totals, pending approvals and data-quality gaps, per PRD §7."
        todo={[
          "Totals, new members and pending approvals",
          "Data-quality gaps with inline fix-and-save lists",
          "Every metric clickable down to its member list",
        ]}
      />
    </>
  );
}
