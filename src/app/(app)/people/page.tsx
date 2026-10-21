import { Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "People" };

export default function PeoplePage() {
  return (
    <>
      <PageHeader
        title="People"
        description="Discover members and connect with relevant professionals."
      />
      <PlaceholderPanel
        icon={Users}
        title="The member directory is next"
        description="Searchable directory and profiles, per PRD §6.2."
        todo={[
          "Search and filters for startup, location, role, experience and interests",
          "Profile page with Member since, tags, LinkedIn and permitted contact details",
          "Members edit permitted fields; edits go to admin review",
        ]}
      />
    </>
  );
}
