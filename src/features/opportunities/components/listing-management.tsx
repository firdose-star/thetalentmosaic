"use client";

/**
 * Admin-only scraper and listing management (spec §8.6, §8.8): active vs
 * expired, listings by source, duplicates, broken links, last successful run,
 * records awaiting review and source-specific errors.
 */
import { CheckCircle2, CircleAlert, Clock, Copy, Link2Off, TriangleAlert } from "lucide-react";

import { Section } from "@/components/shared/section";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useScraperStatus } from "../hooks/use-opportunities";

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="gap-1 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export function ListingManagement() {
  const { data, isPending, isError, error, refetch } = useScraperStatus();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 @3xl/main:grid-cols-4">
        <Kpi label="Active listings" value={data.counts.active} hint="Published to members" />
        <Kpi label="Expired" value={data.counts.expired} hint="Closed at the source" />
        <Kpi label="Awaiting review" value={data.counts.review} hint="Not yet published" />
        <Kpi label="Last successful run" value={data.lastSuccessfulRun} />
      </div>

      <div className="grid items-start gap-4 @4xl/main:grid-cols-2">
        <Section title="Listings by source">
          <ul className="flex flex-col divide-y">
            {data.sources.map((source) => (
              <li key={source.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                {source.status === "ok" ? (
                  <CheckCircle2 className="size-4 text-primary" aria-label="Healthy" />
                ) : (
                  <TriangleAlert className="size-4 text-chart-3" aria-label="Needs attention" />
                )}
                <span className="flex-1 text-sm">{source.name}</span>
                <span className="text-sm font-semibold tabular-nums">{source.listings}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Source errors" description="From the latest scraper runs.">
          <ul className="flex flex-col gap-2">
            {data.errors.map((e) => (
              <li key={`${e.at}-${e.source}`} className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                <span>
                  <span className="font-medium">{e.source}</span>{" "}
                  <span className="text-muted-foreground">· {e.at}</span>
                  <span className="block text-muted-foreground">{e.message}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Broken application links">
          <ul className="flex flex-col gap-2">
            {data.brokenLinks.map((link) => (
              <li key={link.jobId} className="flex items-start gap-2 text-sm">
                <Link2Off className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                <span>
                  {link.title} · <span className="text-muted-foreground">{link.company}</span>
                  <span className="block text-xs text-muted-foreground">{link.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Duplicate records">
          <ul className="flex flex-col gap-2">
            {data.duplicates.map((dup) => (
              <li key={`${dup.company}-${dup.title}`} className="flex items-start gap-2 text-sm">
                <Copy className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  {dup.title} · <span className="text-muted-foreground">{dup.company}</span>
                  <span className="block text-xs text-muted-foreground">Found on {dup.sources.join(" and ")}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Expired and awaiting review" description="Hidden from members.">
        <ul className="flex flex-col divide-y">
          {data.inactive.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <Clock className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-sm">
                {job.title} · <span className="text-muted-foreground">{job.company}, {job.location}</span>
              </span>
              <Badge variant={job.status === "review" ? "secondary" : "outline"}>
                {job.status === "review" ? "Awaiting review" : "Expired"}
              </Badge>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
