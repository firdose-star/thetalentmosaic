import { Inbox } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Submissions & Approvals" };

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Submissions & Approvals"
        description="One queue for suggestions, hosted events, profile changes and birthday messages."
      />
      <PlaceholderPanel
        icon={Inbox}
        title="The approvals queue is coming"
        description="Per PRD §7."
        todo={[
          "Vendor and resource suggestions",
          "Member-hosted events and profile change requests",
          "Approve, edit, or reject with a reason",
        ]}
      />
    </>
  );
}
