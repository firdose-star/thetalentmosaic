"use client";

/**
 * Community Health — admin only. Three tabs: platform engagement, member
 * activity (last login date and time), and engagement tags.
 *
 * Hiding this from members is UX; the API must refuse these reads for
 * non-admins.
 */
import { ShieldAlert } from "lucide-react";

import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState } from "@/components/shared/state-views";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EngagementPanel } from "./engagement-panel";
import { EngagementTags } from "./engagement-tags";
import { MemberActivity } from "./member-activity";

export function HealthDashboard() {
  return (
    <RoleGuard
      allow={["admin"]}
      fallback={<EmptyState icon={ShieldAlert} title="Admins only" description="Community Health is visible to the Talent Mosaic team." />}
    >
      <Tabs defaultValue="engagement">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="activity">Member activity</TabsTrigger>
          <TabsTrigger value="tags">Engagement tags</TabsTrigger>
        </TabsList>
        <TabsContent value="engagement" className="mt-4"><EngagementPanel /></TabsContent>
        <TabsContent value="activity" className="mt-4"><MemberActivity /></TabsContent>
        <TabsContent value="tags" className="mt-4"><EngagementTags /></TabsContent>
      </Tabs>
    </RoleGuard>
  );
}
