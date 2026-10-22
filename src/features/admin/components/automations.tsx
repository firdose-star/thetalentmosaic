"use client";

/**
 * Automations (PRD §10): birthday messages, digests and reminders. Each one
 * shows its status, last run and next run (calculated from now), and the
 * admin can pause it, change when it runs, or run it straight away. Birthday
 * message approval sits underneath.
 */
import { Play } from "lucide-react";

import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { BirthdayMessages } from "@/features/overview";
import type { Automation, AutomationStatus } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { useAdminActions, useAdminData } from "../hooks/use-admin";

const STATUS: Record<AutomationStatus, string> = {
  scheduled: "bg-muted text-muted-foreground",
  running: "bg-chart-4/20 text-foreground",
  succeeded: "bg-accent text-primary",
  failed: "bg-destructive/10 text-destructive",
};

const FREQUENCIES: Automation["frequency"][] = ["Daily", "Weekly", "Twice weekly", "On approval", "Before each event"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMES = Array.from({ length: 33 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function Automations() {
  const { data, isPending, isError, error, refetch } = useAdminData();
  const { updateAutomation, runAutomation } = useAdminActions();
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        <span className="text-base font-semibold text-foreground">{data.overview.automationsOn}</span> of {data.overview.automationsTotal} automations running ·{" "}
        {data.automations.filter((a) => a.status === "failed").length} failed on the last run
      </p>
      <div className="flex flex-col gap-3">
        {data.automations.map((a) => {
          const timed = a.frequency !== "On approval" && a.frequency !== "Before each event";
          return (
            <Card key={a.id} className={cn("gap-3 p-5", !a.enabled && "opacity-70")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{a.name}</p>
                    <Badge className={STATUS[a.status]}>{a.status === "succeeded" ? "Last run succeeded" : a.status === "failed" ? "Last run failed" : a.status === "running" ? "Running" : "Scheduled"}</Badge>
                    {!a.enabled && <Badge variant="outline">Paused</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={a.enabled} onCheckedChange={(v) => updateAutomation.mutate({ id: a.id, patch: { enabled: Boolean(v) } })} aria-label={`${a.enabled ? "Pause" : "Resume"} ${a.name}`} />
                  {a.enabled ? "On" : "Off"}
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Runs</span>
                <NativeSelect size="sm" aria-label="Frequency" value={a.frequency} onChange={(e) => updateAutomation.mutate({ id: a.id, patch: { frequency: e.target.value as Automation["frequency"], time: a.time || "09:00" } })}>
                  {FREQUENCIES.map((f) => <NativeSelectOption key={f} value={f}>{f}</NativeSelectOption>)}
                </NativeSelect>
                {a.frequency === "Weekly" && (
                  <NativeSelect size="sm" aria-label="Day" value={a.weekday ?? 1} onChange={(e) => updateAutomation.mutate({ id: a.id, patch: { weekday: Number(e.target.value) } })}>
                    {WEEKDAYS.map((d, i) => <NativeSelectOption key={d} value={i}>{d}</NativeSelectOption>)}
                  </NativeSelect>
                )}
                {timed && (
                  <>
                    <span className="text-muted-foreground">at</span>
                    <NativeSelect size="sm" aria-label="Time" value={a.time} onChange={(e) => updateAutomation.mutate({ id: a.id, patch: { time: e.target.value } })}>
                      {TIMES.map((t) => <NativeSelectOption key={t} value={t}>{time12(t)}</NativeSelectOption>)}
                    </NativeSelect>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                <span>Last run: <span className="text-foreground">{a.lastRun}</span> · Next run: <span className="text-foreground">{a.nextRun}</span></span>
                <Button size="sm" variant="outline" disabled={!a.enabled} onClick={() => runAutomation.mutate({ id: a.id })}>
                  <Play data-icon="inline-start" />
                  Run now
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <BirthdayMessages />
    </div>
  );
}
