import { UsersRound } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Member Management" };

export default function MemberManagementPage() {
  return (
    <>
      <PageHeader
        title="Member Management"
        description="Registrations, member records, duplicates, owners and tags."
      />
      <PlaceholderPanel
        icon={UsersRound}
        title="Member Management is coming"
        description="Per PRD §7."
        todo={[
          "Review new registrations and profile change requests",
          "Spot and merge duplicates",
          "Assign relationship owners; edit tags and events attended",
        ]}
      />
    </>
  );
}
