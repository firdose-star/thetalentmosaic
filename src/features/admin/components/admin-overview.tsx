"use client";

/**
 * Admin Overview: what needs doing across the community right now. Every
 * card is a live count from the shared records and leads to its queue.
 */
import {
  Bell,
  Briefcase,
  Cake,
  Copy,
  DatabaseZap,
  FileWarning,
  HeartHandshake,
  Inbox,
  RefreshCw,
  UserPen,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Section } from "@/components/shared/section";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { useAdminData } from "../hooks/use-admin";
import { QueueCard, whenText } from "./admin-parts";
import { ActivityByHour } from "./activity-logs";

const ACTOR_TONE = { Admin: "bg-accent text-primary", Member: "bg-chart-2/20 text-foreground", System: "bg-muted text-muted-foreground" };

export function AdminOverview() {
  const { data, isPending, isError, error, refetch } = useAdminData();
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  const o = data.overview;
  const coverage = Math.round((o.coverage.covered / Math.max(o.coverage.total, 1)) * 100);
  const cards = [
    { href: `${ROUTES.adminMembers}?tab=registrations`, label: "Registrations to review", value: o.registrations, hint: "New people waiting for approval", icon: <UserPlus />, urgent: o.registrations > 0 },
    { href: `${ROUTES.adminMembers}?tab=requests`, label: "Profile and contact requests", value: o.memberRequests, hint: "From members", icon: <UserPen />, urgent: o.memberRequests > 0 },
    { href: ROUTES.adminApprovals, label: "Submissions to approve", value: o.submissions, hint: "Vendors, resources and hosted sessions", icon: <Inbox />, urgent: o.submissions > 0 },
    { href: `${ROUTES.adminMembers}?tab=duplicates`, label: "Possible duplicates", value: o.duplicates, hint: "Profiles that look the same", icon: <Copy /> },
    { href: `${ROUTES.adminMembers}?tab=missing`, label: "Records with missing data", value: o.missingData, hint: "LinkedIn, interests, hobbies, owner…", icon: <FileWarning /> },
    { href: ROUTES.adminData, label: "Data issues", value: o.dataIssues, hint: `${o.importUpdates} sheet updates waiting`, icon: <DatabaseZap />, tone: "bg-destructive/10 text-destructive", urgent: o.dataIssues > 0 },
    { href: ROUTES.health, label: "Relationship coverage", value: `${coverage}%`, hint: `${o.coverage.covered}/${o.coverage.total} with a meaningful contact in 90 days`, icon: <HeartHandshake /> },
    { href: `${ROUTES.adminApprovals}?tab=birthdays`, label: "Birthday messages to approve", value: o.birthdaysToApprove, hint: "Next 10 days, waiting on an admin", icon: <Cake />, tone: "bg-chart-3/20 text-chart-3", urgent: o.birthdaysToApprove > 0 },
    { href: ROUTES.adminAutomations, label: "Automations running", value: `${o.automationsOn} of ${o.automationsTotal}`, hint: "Birthdays, digests and reminders", icon: <Bell /> },
    { href: ROUTES.opportunities, label: "Active roles", value: o.activeRoles, hint: "Live on the job board", icon: <Briefcase />, tone: "bg-chart-4/20 text-chart-4" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Stagger className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-3 @6xl/main:grid-cols-5">
        {cards.map(({ href, ...card }) => (
          <StaggerItem key={card.label} whileHover={{ y: -2 }}>
            <QueueCard href={href} {...card} />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid items-start gap-4 @4xl/main:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section
          title="Latest activity"
          description="Live from the records and every admin action."
          actions={
            <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={ROUTES.adminLogs} />}>
              All activity
            </Button>
          }
        >
          <ul className="flex flex-col divide-y">
            {data.log.slice(0, 10).map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <Badge className={ACTOR_TONE[entry.actorType]}>{entry.actorType}</Badge>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{entry.actor}</span> <span className="text-muted-foreground">{entry.action.toLowerCase()}</span>{" "}
                  <span className="font-medium">{entry.object}</span>
                  {entry.change && <span className="block text-xs text-muted-foreground">{entry.change}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{whenText(entry.at)}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div className="flex flex-col gap-4">
          <ActivityByHour data={data} />
          <Section title="Data sources" description="Last successful sync for each connection.">
            <ul className="flex flex-col divide-y">
              {data.sources.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2 text-sm first:pt-0 last:pb-0">
                  <RefreshCw className="size-4 text-muted-foreground" aria-hidden />
                  <span className="flex-1">{s.name}<span className="block text-xs text-muted-foreground">{s.rows}</span></span>
                  <Badge className={s.status === "ok" ? "bg-accent text-primary" : s.status === "warn" ? "bg-chart-3/20 text-foreground" : "bg-destructive/10 text-destructive"}>
                    {s.status === "ok" ? "Healthy" : s.status === "warn" ? "Needs attention" : "Failing"}
                  </Badge>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
