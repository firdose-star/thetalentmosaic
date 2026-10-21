"use client";

/**
 * Admin-only row of open work, each linking to the queue behind it.
 * Render inside `<RoleGuard allow={["admin"]}>` — hidden from members.
 */
import {
  Copy,
  Inbox,
  TriangleAlert,
  UserPen,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import type { OverviewSummary } from "../types";

export function AttentionBar({
  attention,
}: {
  attention: OverviewSummary["attention"];
}) {
  const items: { href: string; icon: LucideIcon; count: number; label: string }[] = [
    { href: ROUTES.adminMembers, icon: UserPlus, count: attention.registrations, label: "registrations to review" },
    { href: ROUTES.adminMembers, icon: UserPen, count: attention.memberRequests, label: "member requests" },
    { href: ROUTES.adminApprovals, icon: Inbox, count: attention.submissions, label: "submissions to approve" },
    { href: ROUTES.adminMembers, icon: Copy, count: attention.duplicates, label: "possible duplicates" },
    { href: ROUTES.adminData, icon: TriangleAlert, count: attention.dataIssues, label: "data issues" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ href, icon: Icon, count, label }) => (
        <Link
          key={label}
          href={href}
          className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Icon className="size-4 text-primary" aria-hidden />
          <span>
            <span className="font-semibold tabular-nums">{count}</span>{" "}
            <span className="text-muted-foreground">{label}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
