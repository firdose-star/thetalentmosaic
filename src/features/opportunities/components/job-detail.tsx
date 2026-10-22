"use client";

/**
 * Job detail (spec §8.5): title and company, location and arrangement,
 * description and requirements where permitted, posting and last-checked
 * dates, source attribution, and an Apply button to the original source.
 */
import { ArrowLeft, ArrowUpRight, Briefcase, Building2, Clock, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";

import { FadeIn } from "@/components/shared/motion";
import { Section } from "@/components/shared/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { checkedText, postedText } from "../filters";
import { useOpportunity } from "../hooks/use-opportunities";

export function JobDetail({ id }: { id: string }) {
  const { data: job, isPending, isError, error, refetch } = useOpportunity(id);

  const back = (
    <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={ROUTES.opportunities} />}>
      <ArrowLeft data-icon="inline-start" />
      Roles for you
    </Button>
  );

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;
  if (!job) {
    return (
      <>
        {back}
        <EmptyState icon={Briefcase} title="This role is no longer available" description="It may have closed at the source." />
      </>
    );
  }

  const apply = (
    <Button size="lg" nativeButton={false} render={<a href={job.url} target="_blank" rel="noopener noreferrer" />}>
      Apply on {job.source}
      <ArrowUpRight data-icon="inline-end" />
    </Button>
  );

  return (
    <FadeIn className="flex flex-col gap-4">
      {back}

      <Card className="flex-row flex-wrap items-start gap-5 p-6">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Briefcase className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" />{job.company}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{job.location} · {job.arrangement}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{job.hrFunction}</Badge>
            <Badge variant="secondary">{job.seniority}</Badge>
            <Badge variant="outline">{job.type}</Badge>
            {job.salary && <Badge variant="outline">{job.salary}</Badge>}
          </div>
        </div>
        {apply}
      </Card>

      <div className="grid items-start gap-4 @4xl/main:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Section title="About the role">
            <p className="text-sm leading-relaxed">{job.description}</p>
          </Section>
          <Section title="Skills and experience">
            <p className="mb-3 text-sm">{job.experience}</p>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </Section>
        </div>

        <Section title="Listing details">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /><dd>{postedText(job.postedDaysAgo)}</dd></div>
            <div className="flex items-center gap-2"><RefreshCw className="size-4 text-muted-foreground" /><dd>{checkedText(job.lastCheckedDaysAgo)}</dd></div>
            <div>
              <dt className="text-muted-foreground">Source</dt>
              <dd>Listed on {job.source}. The Talent Mosaic does not own or verify this listing.</dd>
            </div>
          </dl>
          <div className="mt-4">{apply}</div>
        </Section>
      </div>
    </FadeIn>
  );
}
