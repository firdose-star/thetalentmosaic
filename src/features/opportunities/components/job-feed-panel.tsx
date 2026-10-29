"use client";

/**
 * Admin → Data & Integrations → Job feed: the boards the feed polls (switch
 * each on or off, add another), the last 20 runs, and "Run now". Collection
 * runs by itself every morning at 08:00 IST. Render inside a RoleGuard.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNowStrict } from "date-fns";
import { Plus, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";

import { Section } from "@/components/shared/section";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COLLECTOR_KINDS, ROLE_SOURCE_LABELS, type CollectorKind, type IngestSource } from "@/types/roles";

import { useJobFeed, useJobFeedAdmin } from "../hooks/use-opportunities";
import { ingestSourceSchema, type IngestSourceInput } from "../schemas";

const ago = (iso?: string) => (iso ? formatDistanceToNowStrict(new Date(iso), { addSuffix: true }) : "never");

function AddBoardForm() {
  const { addSource } = useJobFeedAdmin();
  const form = useForm<IngestSourceInput>({ resolver: zodResolver(ingestSourceSchema), defaultValues: { kind: "greenhouse", slug: "", companyName: "" } });
  const error = form.formState.errors.slug?.message;
  return (
    <form
      className="flex flex-wrap items-start gap-2"
      onSubmit={form.handleSubmit((v) => addSource.mutate({ ...v, companyName: v.companyName || undefined }, { onSuccess: () => form.reset() }))}
      noValidate
    >
      <NativeSelect aria-label="Board" className="w-32" {...form.register("kind")}>
        <NativeSelectOption value="greenhouse">Greenhouse</NativeSelectOption>
        <NativeSelectOption value="lever">Lever</NativeSelectOption>
        <NativeSelectOption value="ashby">Ashby</NativeSelectOption>
        <NativeSelectOption value="linkedin">LinkedIn search</NativeSelectOption>
      </NativeSelect>
      <div>
        <Input aria-label="Board slug" placeholder="slug, or LinkedIn search words" className="w-44" aria-invalid={!!error} {...form.register("slug")} />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      <Input aria-label="Company name" placeholder="Company name" className="w-44" {...form.register("companyName")} />
      <Button type="submit" variant="outline" disabled={addSource.isPending}>
        <Plus data-icon="inline-start" />Add board
      </Button>
    </form>
  );
}

function SourceRow({ source }: { source: IngestSource }) {
  const { toggleSource, runNow } = useJobFeedAdmin();
  const failed = source.lastStatus?.startsWith("error");
  return (
    <TableRow>
      <TableCell>
        <span className="font-medium">{source.companyName ?? ROLE_SOURCE_LABELS[source.kind]}</span>
        {source.slug && <span className="block text-xs text-muted-foreground">{source.slug}</span>}
      </TableCell>
      <TableCell className="text-xs">
        <span className={failed ? "text-destructive" : undefined}>{source.lastStatus ?? "Not run yet"}</span>
        <span className="block text-muted-foreground">{ago(source.lastRunAt)}</span>
      </TableCell>
      <TableCell>
        <Switch
          checked={source.enabled}
          onCheckedChange={(enabled) => toggleSource.mutate({ id: source.id, enabled })}
          aria-label={`Poll ${source.companyName ?? source.kind}`}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button size="xs" variant="ghost" disabled={!source.enabled || runNow.isPending} onClick={() => runNow.mutate({ source: source.kind, id: source.id })}>
          <RefreshCw data-icon="inline-start" />Run now
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function JobFeedPanel() {
  const { data, isPending, isError, error, refetch } = useJobFeed();
  const { runNow } = useJobFeedAdmin();

  if (isError) return <Section title="Job feed"><ErrorState error={error} onRetry={() => void refetch()} /></Section>;
  if (isPending) return <Section title="Job feed"><LoadingState className="min-h-32" /></Section>;

  const byKind = new Map<CollectorKind, IngestSource[]>(COLLECTOR_KINDS.map((k) => [k, data.sources.filter((s) => s.kind === k)]));

  return (
    <Section
      title="Job feed"
      description="HR roles in India or remote, posted in the last 60 days, collected every morning at 08:00 IST. New roles wait in Opportunities → Listing management until you approve them."
      actions={
        <Button size="sm" disabled={runNow.isPending} onClick={() => runNow.mutate({ source: "all" })}>
          <RefreshCw data-icon="inline-start" className={runNow.isPending ? "animate-spin" : undefined} />
          {runNow.isPending ? "Running…" : "Run all now"}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {COLLECTOR_KINDS.map((kind) => {
          const list = byKind.get(kind) ?? [];
          if (list.length === 0) return null;
          return (
            <div key={kind}>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{ROLE_SOURCE_LABELS[kind]} <span className="font-normal text-muted-foreground">· {list.length}</span></h3>
                <Button size="xs" variant="outline" disabled={runNow.isPending} onClick={() => runNow.mutate({ source: kind })}>
                  <RefreshCw data-icon="inline-start" />Run {ROLE_SOURCE_LABELS[kind]}
                </Button>
              </div>
              <Card className="py-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Board</TableHead>
                      <TableHead>Last run</TableHead>
                      <TableHead className="w-16">On</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>{list.map((s) => <SourceRow key={s.id} source={s} />)}</TableBody>
                </Table>
              </Card>
            </div>
          );
        })}

        <AddBoardForm />

        <div>
          <h3 className="mb-1 text-sm font-semibold">Recent runs</h3>
          {data.runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet — press Run all now, or wait for 08:00 IST.</p>
          ) : (
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Fetched</TableHead>
                    <TableHead className="text-right">HR roles</TableHead>
                    <TableHead className="text-right">New</TableHead>
                    <TableHead className="text-right">Seen again</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.runs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{ago(r.startedAt)}</TableCell>
                      <TableCell><Badge variant="outline">{ROLE_SOURCE_LABELS[r.source]}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{r.fetched}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.matched}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.inserted}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.updated}</TableCell>
                      <TableCell className="max-w-72 text-xs">
                        {r.errors.length ? (
                          <details>
                            <summary className="cursor-pointer text-destructive">{r.errors.length} {r.errors.length === 1 ? "issue" : "issues"}</summary>
                            <ul className="mt-1 flex flex-col gap-0.5 break-all text-muted-foreground">{r.errors.map((e) => <li key={e}>{e}</li>)}</ul>
                          </details>
                        ) : (
                          <span className="text-primary">OK</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </Section>
  );
}
