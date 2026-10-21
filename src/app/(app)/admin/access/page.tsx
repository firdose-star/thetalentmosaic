/**
 * `/admin/access` — User Access (PRD §7). The reference list page.
 *
 * Server Component. It composes a header and a client island; it does not fetch.
 * `<UsersTable />` reads `useSearchParams` via `useTableParams`, so it sits
 * under a Suspense boundary.
 */
import { UserPlus } from "lucide-react";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { TableSkeleton } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/features/users";

export const metadata = { title: "User Access" };

export default function UserAccessPage() {
  return (
    <>
      <PageHeader
        title="User Access"
        description="Invite or remove admins and relationship owners, set roles, deactivate members."
        actions={
          // Hiding the button is UX. The API still enforces who may invite.
          <RoleGuard allow={["admin"]}>
            <Button>
              <UserPlus data-icon="inline-start" />
              Invite admin
            </Button>
          </RoleGuard>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <UsersTable />
      </Suspense>
    </>
  );
}
