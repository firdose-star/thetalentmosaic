"use client";

/**
 * Engagement: how many members use the platform and what they do there.
 * An active member is one with at least one login in the period.
 */
import { Activity, Eye, LogIn, Moon, MousePointerClick, Search, Ticket, UserX, Users, Wifi, type LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Section } from "@/components/shared/section";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useEngagement } from "../hooks/use-health";

const weeklyConfig = { members: { label: "Active members", color: "var(--chart-2)" } } satisfies ChartConfig;

function Kpi({ icon: Icon, label, value, of, hint, tone }: { icon: LucideIcon; label: string; value: number; of?: number; hint: string; tone: string }) {
  return (
    <Card className="flex-row items-center gap-3 p-4">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl leading-tight font-semibold tabular-nums">
          {value}
          {of !== undefined && <span className="text-sm font-normal text-muted-foreground">/{of}</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
    </Card>
  );
}

const COUNTER_ICONS: Record<string, LucideIcon> = {
  "Logins this week": LogIn,
  "Searches run": Search,
  "Profile views": Eye,
  "Resources opened": Activity,
  "Role clicks to source": MousePointerClick,
  "Event registrations": Ticket,
};

export function EngagementPanel() {
  const { data, isPending, isError, error, refetch } = useEngagement();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  const pct = (n: number) => `${Math.round((n / data.total) * 100)}% of members`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 @2xl/main:grid-cols-3 @6xl/main:grid-cols-5">
        <Kpi icon={Users} label="Active this week" value={data.activeWeek} of={data.total} hint={pct(data.activeWeek)} tone="bg-accent text-primary" />
        <Kpi icon={Activity} label="Active this month" value={data.activeMonth} of={data.total} hint={pct(data.activeMonth)} tone="bg-accent text-primary" />
        <Kpi icon={Moon} label="Inactive 30+ days" value={data.inactive} hint="Worth a nudge" tone="bg-chart-3/20 text-chart-3" />
        <Kpi icon={UserX} label="Never logged in" value={data.neverLoggedIn} hint="Invited, not yet in" tone="bg-destructive/10 text-destructive" />
        <Kpi icon={Wifi} label="Connected online only" value={data.onlineOnly} of={data.total} hint="Never attended an event" tone="bg-chart-4/20 text-chart-4" />
      </div>

      <div className="grid items-start gap-4 @4xl/main:grid-cols-2">
        <Section title="Weekly active members" description="Members who logged in, week by week.">
          <ChartContainer config={weeklyConfig} className="h-52 w-full">
            <BarChart data={data.weeklyActive} margin={{ left: 0, right: 0, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="members" fill="var(--color-members)" radius={[6, 6, 2, 2]} />
            </BarChart>
          </ChartContainer>
        </Section>

        <Section title="Where members spend their time" description="Share of page views this month." actions={<Badge variant="outline">Sample</Badge>}>
          <ul className="flex flex-col gap-3">
            {data.pageShare.map((p) => (
              <li key={p.page}>
                <div className="flex justify-between text-sm">
                  <span>{p.page}</span>
                  <span className="font-semibold tabular-nums">{p.share}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-2" style={{ width: `${p.share * 3}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Community actions" description="Tracked from day one (PRD §12)." actions={<Badge variant="outline">Sample</Badge>}>
        <div className="grid grid-cols-2 gap-3 @3xl/main:grid-cols-3 @6xl/main:grid-cols-6">
          {data.counters.map((c) => {
            const Icon = COUNTER_ICONS[c.label] ?? Activity;
            return (
              <div key={c.label} className="flex flex-col gap-1 rounded-lg border p-3">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <span className="text-xl font-semibold tabular-nums">{c.value}</span>
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
