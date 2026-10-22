"use client";

/**
 * Admin pages are for the Talent Mosaic team only. Hiding them is UX — the
 * API must refuse these reads and writes for non-admins.
 */
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState } from "@/components/shared/state-views";

export function AdminGate({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      allow={["admin"]}
      fallback={<EmptyState icon={ShieldAlert} title="Admins only" description="This area is for the Talent Mosaic team." />}
    >
      {children}
    </RoleGuard>
  );
}
