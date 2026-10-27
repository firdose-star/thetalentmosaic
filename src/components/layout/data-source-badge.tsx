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
