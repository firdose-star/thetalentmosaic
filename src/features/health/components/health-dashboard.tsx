"use client";

/**
 * Community Health and Engagement (PRD §8) — admin only.
 *
 * One dashboard, two kinds of view: the combined view of every member, and
 * each relationship owner's own view (plus Unassigned). The view selector
 * re-scopes every tab, and every number uses the members in view as its
 * live denominator. Tab and view are kept in the URL.
 *
 * Hiding this from members is UX; the API must refuse these reads for
 * non-admins.
 */
import { ShieldAlert, Users } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useHealthData } from "../hooks/use-health";
import { UNASSIGNED, pct, scopeLabel, scopeMembers } from "../metrics";
import { EngagementTab } from "./engagement-tab";
import { EventsTab } from "./events-tab";
import { OutreachTab } from "./outreach-tab";
import { OverviewTab } from "./overview-tab";
import { OwnersTab } from "./owners-tab";
import { SettingsTab } from "./settings-tab";
import { TimelineTab } from "./timeline-tab";

const KEYS = ["tab", "view"] as const;

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "outreach", label: "Outreach & Follow-ups" },
  { value: "engagement", label: "Member Engagement" },
  { value: "owners", label: "Relationship Owners" },
  { value: "timeline", label: "Activity Timeline" },
  { value: "events", label: "Events & Participation" },
  { value: "settings", label: "Settings & Data" },
];

function Dashboard() {
  const { values, set } = useUrlFilters(KEYS);
  const { data, isPending, isError, error, refetch } = useHealthData();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  const scope = values.view;
  const list = scopeMembers(data.members, scope);
  const tab = values.tab || "overview";
  const props = { data, list };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex-col gap-3 p-4 @3xl/main:flex-row @3xl/main:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Users className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">Viewing: {scopeLabel(scope)}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{list.length}</span> of {data.members.length} community members ·{" "}
            {pct(list.length, data.members.length)} · every number below is out of these {list.length}
          </p>
        </div>
        <NativeSelect aria-label="View" value={scope} onChange={(e) => set("view", e.target.value)} className="@3xl/main:w-64">
          <NativeSelectOption value="">All members (combined)</NativeSelectOption>
          {data.settings.owners.map((o) => (
            <NativeSelectOption key={o} value={o}>{o}’s members</NativeSelectOption>
          ))}
          <NativeSelectOption value={UNASSIGNED}>Unassigned</NativeSelectOption>
        </NativeSelect>
      </Card>

      <Tabs value={tab} onValueChange={(v) => set("tab", v === "overview" ? "" : String(v))}>
        <div className="overflow-x-auto pb-1">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {list.length === 0 && tab !== "owners" && tab !== "settings" ? (
          <EmptyState title="No members in this view" description="Assign members to this owner from any member row." />
        ) : (
          <>
            <TabsContent value="overview" className="mt-4"><OverviewTab {...props} scoped={Boolean(scope)} /></TabsContent>
            <TabsContent value="outreach" className="mt-4"><OutreachTab {...props} /></TabsContent>
            <TabsContent value="engagement" className="mt-4"><EngagementTab {...props} /></TabsContent>
            <TabsContent value="timeline" className="mt-4"><TimelineTab {...props} /></TabsContent>
            <TabsContent value="events" className="mt-4"><EventsTab {...props} /></TabsContent>
          </>
        )}
        <TabsContent value="owners" className="mt-4">
          <OwnersTab data={data} scope={scope} onScope={(s) => set("view", s)} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab {...props} /></TabsContent>
      </Tabs>
    </div>
  );
}

export function HealthDashboard() {
  return (
    <RoleGuard
      allow={["admin"]}
      fallback={<EmptyState icon={ShieldAlert} title="Admins only" description="Community Health is visible to the Talent Mosaic team." />}
    >
      <Dashboard />
    </RoleGuard>
  );
}
