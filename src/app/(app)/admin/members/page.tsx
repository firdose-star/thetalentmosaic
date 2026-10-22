import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { AdminGate, MemberManagement } from "@/features/admin";

export const metadata = { title: "Member Management" };

export default function MemberManagementPage() {
  return (
    <>
      <PageHeader title="Member Management" description="Review registrations, keep records accurate and manage member status." />
      <AdminGate>
        <Suspense fallback={<LoadingState className="min-h-64" />}>
        <MemberManagement />
        </Suspense>
      </AdminGate>
    </>
  );
}
