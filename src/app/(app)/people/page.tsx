/**
 * `/people` — the member directory (spec §6). Filters live in the URL, so
 * Overview cards deep-link here (`/people?city=Mumbai`).
 */
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { PeopleDirectory } from "@/features/people";

export const metadata = { title: "People" };

export default function PeoplePage() {
  return (
    <>
      <PageHeader
        title="People in the Mosaic"
        description="The people behind the Talent Mosaic!"
      />
      {/* PeopleDirectory reads useSearchParams, which needs a Suspense boundary. */}
      <Suspense fallback={<LoadingState className="min-h-64" />}>
        <PeopleDirectory />
      </Suspense>
    </>
  );
}
