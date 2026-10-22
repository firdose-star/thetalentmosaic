/**
 * `/events` — Community Catchups (spec §9).
 */
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { EventsView } from "@/features/events";

export const metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <>
      <PageHeader title="Community Catchups" description="Fun Stuff that we do!" />
      <Suspense fallback={<LoadingState className="min-h-64" />}>
        <EventsView />
      </Suspense>
    </>
  );
}
