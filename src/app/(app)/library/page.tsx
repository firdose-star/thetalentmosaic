import { BookOpen } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <>
      <PageHeader
        title="Library"
        description="Vendor recommendations, HR resources and community knowledge."
      />
      <PlaceholderPanel
        icon={BookOpen}
        title="The Library is coming"
        description="Vendors and HR resources, per PRD §6.3."
        todo={[
          "Vendor directory with expandable cards and copy/open actions",
          "HR resources with a type filter defaulting to Show All",
          "Member suggestions that publish only after admin approval",
        ]}
      />
    </>
  );
}
