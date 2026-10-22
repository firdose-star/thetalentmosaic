import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { AdminGate, Submissions } from "@/features/admin";

export const metadata = { title: "Submissions & Approvals" };

export default function SubmissionsPage() {
  return (
    <>
      <PageHeader title="Submissions & Approvals" description="Only approved vendors, resources and sessions appear to members." />
      <AdminGate>
        <Suspense fallback={<LoadingState className="min-h-64" />}>
        <Submissions />
        </Suspense>
      </AdminGate>
    </>
  );
}
