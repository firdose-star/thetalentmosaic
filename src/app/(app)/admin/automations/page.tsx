import { BellRing } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Automations" };

export default function AutomationsPage() {
  return (
    <>
      <PageHeader
        title="Automations"
        description="Birthday messages and follow-up digests."
      />
      <PlaceholderPanel
        icon={BellRing}
        title="Automations are coming"
        description="Per PRD §10."
        todo={[
          "Birthday messages: draft, admin approval, click-to-send on WhatsApp",
          "Follow-up digests per relationship owner",
          "Status, last run and next run for every automation",
        ]}
      />
    </>
  );
}
