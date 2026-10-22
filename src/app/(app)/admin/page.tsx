import { PageHeader } from "@/components/shared/page-header";
import { AdminGate, AdminOverview } from "@/features/admin";

export const metadata = { title: "Admin Overview" };

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader title="Admin Overview" description="What needs doing across the community right now." />
      <AdminGate>
        <AdminOverview />
      </AdminGate>
    </>
  );
}
