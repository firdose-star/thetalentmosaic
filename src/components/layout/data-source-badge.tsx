"use client";

/**
 * Admin-only hint in the top bar: is the dashboard showing the real
 * community (the Mastersheet), or has nothing loaded?
 */
import { Database } from "lucide-react";
import Link from "next/link";

import { RoleGuard } from "@/components/shared/role-guard";
import { useCommunitySource } from "@/components/shared/community-data-gate";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";

export function DataSourceBadge() {
  const { data } = useCommunitySource();
  if (!data) return null;
  const live = data.kind === "mastersheet";

  return (
    <RoleGuard allow={["admin"]}>
      <Link href={ROUTES.adminData} className="hidden sm:block">
        <Badge className={live ? "bg-accent text-primary" : "bg-chart-3/20 text-foreground"}>
          <Database data-icon="inline-start" />
          {live ? `Live · Mastersheet · ${data.members} members` : "No data loaded"}
        </Badge>
      </Link>
    </RoleGuard>
  );
}

/**
 * Shown on every page when no community data loaded: the Mastersheet exports
 * live only on the laptop that runs the app (they hold personal details), so a
 * hosted copy — e.g. the Vercel preview — is empty by design. Say so plainly
 * instead of showing a dashboard full of zeros.
 */
export function NoDataBanner() {
  const { data } = useCommunitySource();
  if (data?.kind !== "empty") return null;
  return (
    <div role="status" className="flex flex-col gap-1 rounded-xl border border-chart-3/50 bg-chart-3/15 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <Database className="size-4" />
        No community data on this copy of the app
      </p>
      <p className="text-muted-foreground">
        The member data stays on the laptop that runs the app, so hosted previews show zeros. Open{" "}
        <a href="http://localhost:3000" className="font-medium text-foreground underline underline-offset-2">
          localhost:3000
        </a>{" "}
        on that laptop to see the live community.
      </p>
    </div>
  );
}
