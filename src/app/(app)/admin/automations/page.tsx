import { PageHeader } from "@/components/shared/page-header";
import { AdminGate, Automations } from "@/features/admin";

export const metadata = { title: "Automations" };

export default function AutomationsPage() {
  return (
    <>
      <PageHeader title="Automations" description="Birthday messages, digests and reminders — and whether each is working." />
      <AdminGate>
        <Automations />
      </AdminGate>
    </>
  );
}
