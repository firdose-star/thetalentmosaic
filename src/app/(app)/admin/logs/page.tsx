import { PageHeader } from "@/components/shared/page-header";
import { AdminGate, ActivityLogs } from "@/features/admin";

export const metadata = { title: "Activity Logs" };

export default function ActivityLogsPage() {
  return (
    <>
      <PageHeader title="Activity Logs" description="Who did what, and when — admin actions, member activity and system events." />
      <AdminGate>
        <ActivityLogs />
      </AdminGate>
    </>
  );
}
