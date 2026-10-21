import { CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderPanel } from "@/components/shared/placeholder-panel";

export const metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <>
      <PageHeader
        title="Events"
        description="Upcoming and past events, and hosting your own."
      />
      <PlaceholderPanel
        icon={CalendarDays}
        title="Events are coming"
        description="Upcoming, past and calendar views, per PRD §6.5."
        todo={[
          "Upcoming and past events with a calendar view",
          "Host a session form, with admin approval before publishing",
          "Members see city only; admins see the full venue",
        ]}
      />
    </>
  );
}
