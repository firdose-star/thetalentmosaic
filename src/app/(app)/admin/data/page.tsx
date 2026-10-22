import { PageHeader } from "@/components/shared/page-header";
import { AdminGate, DataIntegrations } from "@/features/admin";

export const metadata = { title: "Data & Integrations" };

export default function DataIntegrationsPage() {
  return (
    <>
      <PageHeader title="Data & Integrations" description="Where community data comes from, and what went wrong." />
      <AdminGate>
        <DataIntegrations />
      </AdminGate>
    </>
  );
}
