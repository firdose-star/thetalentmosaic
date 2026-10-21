import { Briefcase } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return (
    <>
      <PageHeader
        title="Opportunities"
        description="HR job openings from the job feed."
      />
      <PlaceholderPanel
        icon={Briefcase}
        title="The job board is coming"
        description="Scraped HR roles with filters and apply links, per PRD §6.4."
        todo={[
          "Searchable listings with filters and apply links",
          "Expire listings when the source closes them",
          "Overview count reflects only valid listings",
        ]}
      />
    </>
  );
}
