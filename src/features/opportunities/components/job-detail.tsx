"use client";

/**
 * Role detail: the full description, how to apply, the contact block (only
 * when the API sent contact details — signed-in members), and "Apply at
 * source", which opens the original posting.
 */
import { ArrowLeft, ArrowUpRight, Briefcase, Building2, CheckCircle2, Clock, Link2, Lock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { FadeIn } from "@/components/shared/motion";
import { Section } from "@/components/shared/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { ROLE_FAMILY_LABELS, ROLE_SENIORITY_LABELS, ROLE_SOURCE_LABELS, type RoleContact } from "@/types/roles";

import { checkedText, locationText, postedText, sourceLabel, typeText, whatsappUrl } from "../filters";
import { useRole } from "../hooks/use-opportunities";

function ContactBlock({ contact }: { contact?: RoleContact }) {
  if (!contact) {
    return (
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" />
        Sign in to see contact details.
      </p>
    );
  }
  const link = "inline-flex items-center gap-2 break-all hover:text-primary";
  return (
    <div className="flex flex-col gap-2 text-sm">
      {(contact.name || contact.roleAtCompany) && (
        <p>
          <span className="font-medium">{contact.name}</span>
          {contact.roleAtCompany && <span className="text-muted-foreground">{contact.name ? " · " : ""}{contact.roleAtCompany}</span>}
        </p>
      )}
      {contact.email && <a className={link} href={`mailto:${contact.email}`}><Mail className="size-4 shrink-0" />{contact.email}</a>}
      {contact.whatsapp && (
        <a className={link} href={whatsappUrl(contact.whatsapp)} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4 shrink-0" />WhatsApp {contact.whatsapp}
        </a>
      )}
      {contact.phone && contact.phone !== contact.whatsapp && <a className={link} href={`tel:${contact.phone}`}><Phone className="size-4 shrink-0" />{contact.phone}</a>}
      {contact.linkedinUrl && (
        <a className={link} href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer"><Link2 className="size-4 shrink-0" />LinkedIn profile</a>
      )}
      {contact.other && <p className="text-muted-foreground">{contact.other}</p>}
    </div>
  );
}

export function JobDetail({ id }: { id: string }) {
  const { data: role, isPending, isError, error, refetch } = useRole(id);

  const back = (
    <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={ROUTES.opportunities} />}>
      <ArrowLeft data-icon="inline-start" />
      Roles for you
    </Button>
  );

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;
  if (!role) {
    return (
      <>
        {back}
        <EmptyState icon={Briefcase} title="This role is no longer available" description="It may have closed at the source." />
      </>
    );
  }

  const [primary, ...others] = role.sources;
  const type = typeText(role);
  const checked = checkedText(role);
  const apply = primary && (
    <Button size="lg" nativeButton={false} render={<a href={primary.url} target="_blank" rel="noopener noreferrer" />}>
      Apply at source
      <ArrowUpRight data-icon="inline-end" />
    </Button>
  );

  return (
    <FadeIn className="flex flex-col gap-4">
      {back}

      <Card className="flex-row flex-wrap items-start gap-5 p-6">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent text-primary">
          {role.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logos come from many hosts
            <img src={role.company.logoUrl} alt="" className="size-full object-contain" />
          ) : (
            <Briefcase className="size-6" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{role.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4" />
              {role.company.url ? <a href={role.company.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{role.company.name}</a> : role.company.name}
            </span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{locationText(role)}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{ROLE_FAMILY_LABELS[role.roleFamily]}</Badge>
            {role.seniority !== "unknown" && <Badge variant="secondary">{ROLE_SENIORITY_LABELS[role.seniority]}</Badge>}
            {type && <Badge variant="outline">{type}</Badge>}
            {role.company.ycBatch && <Badge variant="outline">YC {role.company.ycBatch}</Badge>}
            {role.salary.text && <Badge variant="outline">{role.salary.text}</Badge>}
          </div>
        </div>
        {apply}
      </Card>

      <div className="grid items-start gap-4 @4xl/main:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Section title="About the role">
            <p className="whitespace-pre-line text-sm leading-relaxed">{role.description || "The source gave no description — open it at the source."}</p>
          </Section>
          {role.howToApply && (
            <Section title="How to apply">
              <p className="whitespace-pre-line text-sm">{role.howToApply}</p>
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Section title="Contact">
            <ContactBlock contact={role.contact} />
          </Section>
          <Section title="Listing details">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /><dd>{postedText(role)}</dd></div>
              {checked && <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /><dd>{checked}</dd></div>}
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd>
                  {sourceLabel(role)}{primary?.posterName ? ` · posted by ${primary.posterName}` : ""}. The Talent Mosaic doesn&apos;t own this listing — apply at the source.
                </dd>
              </div>
              {others.length > 0 && (
                <div>
                  <dt className="text-muted-foreground">Also listed on</dt>
                  <dd className="flex flex-wrap gap-x-3">
                    {others.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {ROLE_SOURCE_LABELS[s.source]}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            {apply && <div className="mt-4">{apply}</div>}
          </Section>
        </div>
      </div>
    </FadeIn>
  );
}
