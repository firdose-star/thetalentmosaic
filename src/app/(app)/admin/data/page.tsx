import { DatabaseZap } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Data & Integrations" };

export default function DataPage() {
  return (
    <>
      <PageHeader
        title="Data & Integrations"
        description="Imports, the job feed, sync status and errors."
      />
      <PlaceholderPanel
        icon={DatabaseZap}
        title="Data & Integrations is coming"
        description="Per PRD §10."
        todo={[
          "Google Sheets and file imports with column mapping and preview",
          "Job feed connection and last sync time",
          "Failed rows, error log and manual re-sync",
        ]}
      />
    </>
  );
}
