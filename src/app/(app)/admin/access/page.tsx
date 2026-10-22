import { PageHeader } from "@/components/shared/page-header";
import { AdminGate, UserAccess } from "@/features/admin";

export const metadata = { title: "User Access" };

export default function UserAccessPage() {
  return (
    <>
      <PageHeader title="User Access" description="Who can sign in and what each role can do." />
      <AdminGate>
        <UserAccess />
      </AdminGate>
    </>
  );
}
