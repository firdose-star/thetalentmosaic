"use client";

/**
 * A member's profile (spec §6.3, §6.5). Everyone sees designation, LinkedIn,
 * city, photo and hobbies. Contact and email are admin only — members get a
 * "Request contact details" action instead. Admins also see the record panel
 * (status, owner, data gaps, change history — spec §6.6).
 */
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { MemberSince } from "@/components/shared/member-since";
import { FadeIn } from "@/components/shared/motion";
import { Section } from "@/components/shared/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { shortDate } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { EditMemberButton } from "@/features/admin";
import { MemberOwnerSelect } from "@/features/health";
import { useMemberProfile, useRequestContact } from "../hooks/use-people";
import type { MemberProfile as Profile } from "../types";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 @md/main:grid-cols-[9rem_1fr] @md/main:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <span className="text-muted-foreground">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function ContactPanel({ profile }: { profile: Profile }) {
  const request = useRequestContact();

  if (profile.contact) {
    return (
      <Section title="Contact" description="Visible to admins only.">
        <dl className="flex flex-col gap-3">
          <Detail label="Email">
            <a href={`mailto:${profile.contact.email}`} className="inline-flex items-center gap-1.5 hover:underline">
              <Mail className="size-3.5" /> {profile.contact.email}
            </a>
          </Detail>
          <Detail label="WhatsApp">
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="size-3.5" /> {profile.contact.whatsapp}
            </span>
          </Detail>
        </dl>
      </Section>
    );
  }

  return (
    <Section title="Contact" description="Contact details are shared through the admins.">
      <Button
        variant="outline"
        onClick={() => request.mutate(profile.id)}
        disabled={request.isPending || request.isSuccess}
      >
        <Send data-icon="inline-start" />
        {request.isSuccess ? "Request sent" : "Request contact details"}
      </Button>
    </Section>
  );
}

export function MemberProfile({ id }: { id: string }) {
  const { data: profile, isPending, isError, error, refetch } = useMemberProfile(id);

  const back = (
    <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={ROUTES.people} />}>
      <ArrowLeft data-icon="inline-start" />
      People
    </Button>
  );

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;
  if (!profile) {
    return (
      <>
        {back}
        <EmptyState icon={UserRoundX} title="Member not found" description="They may have left the community." />
      </>
    );
  }

  return (
    <FadeIn className="flex flex-col gap-4">
      {back}

      <Card className="flex-row flex-wrap items-center gap-5 p-6">
        <MemberAvatar name={profile.name} className="size-20 text-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
          <p className="text-muted-foreground">{profile.designation}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" /> {profile.startup}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {profile.city}</span>
            <MemberSince joinedOn={profile.joinedOn} />
          </div>
        </div>
        {profile.linkedin && (
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={`https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink data-icon="inline-start" />
            LinkedIn
          </Button>
        )}
      </Card>

      <div className="grid items-start gap-4 @4xl/main:grid-cols-[minmax(0,1fr)_22rem]">
        <Section title="About">
          <dl className="flex flex-col gap-3">
            <Detail label="In the Mosaic">
              <span className="flex flex-wrap items-center gap-2">
                <MemberSince joinedOn={profile.joinedOn} />
                <span className="text-muted-foreground">Joined {shortDate(profile.joinedOn, true)}</span>
              </span>
            </Detail>
            <Detail label="Designation">{profile.designation}</Detail>
            <Detail label="Startup">{profile.startup}</Detail>
            <Detail label="City">{profile.city}</Detail>
            <Detail label="HR function">{profile.hrFunction}</Detail>
            <Detail label="Seniority">{profile.seniority}</Detail>
            <Detail label="Experience">{profile.yearsOfExperience === null ? <span className="text-muted-foreground">Not shared yet</span> : `${profile.yearsOfExperience} years in HR`}</Detail>
            <Detail label="LinkedIn">
              {profile.linkedin ? (
                <a href={`https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {profile.linkedin}
                </a>
              ) : (
                <span className="text-muted-foreground">Not shared</span>
              )}
            </Detail>
            <Detail label="Hobbies"><Chips items={profile.hobbies} empty="Not shared yet" /></Detail>
            {profile.tags.length > 0 && (
              <Detail label="Tags"><Chips items={profile.tags} empty="" /></Detail>
            )}
          </dl>
        </Section>

        <div className="flex flex-col gap-4">
          <ContactPanel profile={profile} />

          {profile.admin && (
            <Section
              title="Member record"
              description="Admin only."
              actions={<EditMemberButton memberId={profile.id} label="Edit member" size="sm" />}
            >
              <dl className="flex flex-col gap-3">
                <Detail label="Status">
                  <Badge variant={profile.admin.status === "Active" ? "secondary" : "outline"}>
                    {profile.admin.status}
                  </Badge>
                </Detail>
                <Detail label="Owner"><MemberOwnerSelect memberId={profile.id} memberName={profile.name} /></Detail>
                <Detail label="Events attended">
                  <span className="flex flex-wrap items-center gap-2">
                    {profile.eventsAttended}
                  </span>
                </Detail>
                <Detail label="Tags"><Chips items={profile.tags} empty="None yet" /></Detail>
                <Detail label="Last login">
                  {profile.admin.lastLoginAt
                    ? new Date(profile.admin.lastLoginAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                    : "Never logged in"}
                </Detail>
                <Detail label="Missing data">
                  <Chips items={profile.admin.missing} empty="Complete" />
                </Detail>
              </dl>
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Change history
                </p>
                <ul className="flex flex-col gap-2">
                  {profile.admin.history.map((entry) => (
                    <li key={`${entry.date}-${entry.change}`} className="text-sm">
                      <span className="text-muted-foreground tabular-nums">{shortDate(entry.date, true)}</span>{" "}
                      · {entry.change} <span className="text-muted-foreground">({entry.by})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
