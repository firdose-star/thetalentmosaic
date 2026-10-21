"use client";

/**
 * Member-centred panels: birthdays (today + next 10 days) and recent joiners.
 */
import { Cake } from "lucide-react";
import Link from "next/link";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { memberSince, parseDay, shortDate } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MemberCard, OverviewSummary } from "../types";

function MemberRow({
  member,
  trailing,
  className,
}: {
  member: MemberCard;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={`${ROUTES.people}/${member.id}`}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <MemberAvatar name={member.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {member.designation}, {member.startup}
        </p>
      </div>
      {trailing}
    </Link>
  );
}

export function BirthdaysPanel({
  birthdays,
}: {
  birthdays: OverviewSummary["birthdays"];
}) {
  const names = birthdays.today.map((m) => m.name.split(" ")[0]);
  const greeting =
    names.length > 1
      ? `Happy birthday, ${names.slice(0, -1).join(", ")} and ${names.at(-1)}!`
      : names.length === 1
        ? `Happy birthday, ${names[0]}!`
        : "No birthdays today. Here is who is coming up.";

  return (
    <Section title="We’re celebrating you today" description={greeting}>
      <div id="birthdays" className="flex scroll-mt-20 flex-col gap-4">
        {birthdays.today.length > 0 && (
          <div className="grid gap-2 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
            {birthdays.today.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                className="border-chart-3/50 bg-chart-3/10"
                trailing={<Cake className="size-4 text-chart-3" aria-hidden />}
              />
            ))}
          </div>
        )}
        {birthdays.upcoming.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Coming up in the next 10 days
            </p>
            <div className="grid gap-2 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
              {birthdays.upcoming.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  trailing={<Badge variant="secondary">{shortDate(m.date)}</Badge>}
                />
              ))}
            </div>
          </div>
        ) : (
          birthdays.today.length === 0 && (
            <EmptyState icon={Cake} title="No birthdays in the next 10 days" />
          )
        )}
      </div>
    </Section>
  );
}

export function RecentMembersPanel({
  members,
  asOf,
}: {
  members: MemberCard[];
  asOf: string;
}) {
  return (
    <Section
      title="We can’t wait to see the magic you add here"
      description="Members who joined us recently."
      actions={
        <Button variant="outline" size="sm" render={<Link href={ROUTES.people} />}>
          Open the directory
        </Button>
      }
    >
      <div id="new-members" className="scroll-mt-20">
        {members.length === 0 ? (
          <EmptyState title="No new members in the last 10 days" />
        ) : (
          <div className="grid gap-2 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                trailing={
                  <Badge variant="outline" className="shrink-0">
                    {memberSince(m.joinedOn, parseDay(asOf))}
                  </Badge>
                }
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
