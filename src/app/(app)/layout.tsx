/**
 * `(app)` — every signed-in route: the session guard, the community data
 * load, and the shared shell.
 *
 * Two layers of gating, on purpose:
 *   `proxy.ts`   runs before render — no flash of a protected page.
 *   `<AuthGate>` runs after the silent refresh settles — handles the case where
 *                the cookie exists but the session is actually dead.
 *
 * Neither is authorization. The API is.
 */
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/shared/auth-gate";
import { CommunityDataGate } from "@/components/shared/community-data-gate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <CommunityDataGate>
        <AppShell>{children}</AppShell>
      </CommunityDataGate>
    </AuthGate>
  );
}
