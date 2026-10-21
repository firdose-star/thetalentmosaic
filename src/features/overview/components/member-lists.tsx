"use client";

/**
 * Member-centred panels for the right rail: birthdays (today + next 10 days)
 * and recent joiners. Compact rows so a list of ten fits without scrolling.
 */
import { ArrowRight, Cake, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={`${ROUTES.people}/${member.id}`}
      className={cn(
        "-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors outline-none hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <MemberAvatar name={member.name} className="size-8" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{member.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {member.designation}, {member.startup}
        </span>
      </span>
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
        : "No birthdays today — here is who is coming up.";

  return (
    <Section title="Birthdays" description={greeting} contentClassName="flex flex-col">
      <div id="birthdays" className="flex scroll-mt-20 flex-col">
        {birthdays.today.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            className="bg-chart-3/10 hover:bg-chart-3/20"
            trailing={
              <Badge className="shrink-0 bg-chart-3 text-foreground">
                <Cake data-icon="inline-start" />
                Today
              </Badge>
            }
          />
        ))}
        {birthdays.upcoming.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            trailing={
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {shortDate(m.date)}
              </span>
            }
          />
        ))}
        {birthdays.today.length + birthdays.upcoming.length === 0 && (
          <EmptyState icon={Cake} title="No birthdays in the next 10 days" />
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
      title="Recently joined"
      description="We can’t wait to see the magic you add here."
      actions={
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={ROUTES.people} />}>
          Directory
          <ArrowRight data-icon="inline-end" />
        </Button>
      }
      contentClassName="flex flex-col"
    >
      <div id="new-members" className="flex scroll-mt-20 flex-col">
        {members.length === 0 ? (
          <EmptyState icon={Sparkles} title="No new members in the last 10 days" />
        ) : (
          members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              trailing={
                <span className="shrink-0 text-xs text-muted-foreground">
                  {memberSince(m.joinedOn, parseDay(asOf)).replace("Member since ", "")}
                </span>
              }
            />
          ))
        )}
      </div>
    </Section>
  );
}
