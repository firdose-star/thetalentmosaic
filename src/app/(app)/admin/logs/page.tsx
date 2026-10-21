import { Activity } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Activity Logs" };

export default function ActivityLogsPage() {
  return (
    <>
      <PageHeader
        title="Activity Logs"
        description="Who changed what and when, across member data, approvals, imports and settings."
      />
      <PlaceholderPanel
        icon={Activity}
        title="Activity is not wired up yet"
        description="An append-only audit log of admin actions and data imports (PRD §11)."
        todo={[
          "Create src/features/activity/ by copying src/features/users/",
          "Use useInfiniteQuery for the log — an audit trail is cursor-paginated, not offset-paginated",
          "Add date-range and actor filters through useTableParams",
        ]}
      />
    </>
  );
}
