"use client";

/**
 * Admin: the review queue. Every collected or added role lands here as
 * Unverified; nothing reaches members until it is Approved. Approve, Hide,
 * Edit or Delete per role; counters per status; Add from URL / Add a role.
 */
import { formatDistanceToNowStrict } from "date-fns";
import { Check, ChevronLeft, ChevronRight, EyeOff, ExternalLink, Inbox, Mail, MessageCircle, Phone, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_FAMILY_LABELS, ROLE_SOURCE_LABELS, ROLE_STATUSES, type RoleListing, type RoleStatus } from "@/types/roles";

import { locationText, postedText } from "../filters";
import { useAdminRoles, useRoleAdmin } from "../hooks/use-opportunities";
import { AddFromUrlDialog } from "./add-from-url-dialog";
import { DeleteRoleButton, RoleFormDialog } from "./job-form-dialog";

const TAB_LABELS: Record<RoleStatus, string> = { unverified: "Unverified", approved: "Approved", hidden: "Hidden", expired: "Expired" };
const EMPTY_TEXT: Record<RoleStatus, string> = {
  unverified: "Nothing waiting for review. New roles from the feed and from links land here.",
  approved: "No approved roles yet — members see nothing until you approve one.",
  hidden: "No hidden roles.",
  expired: "No expired roles.",
};

function QueueRow({ role }: { role: RoleListing }) {
  const { update } = useRoleAdmin();
  const setStatus = (status: RoleStatus) => update.mutate({ id: role.id, patch: { status } });
  const warnings = role.extraction?.warnings ?? [];
  const confidence = role.extraction?.confidence;
  const c = role.contact;

  return (
    <Card className="gap-2 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{role.title}</p>
          <p className="text-sm text-muted-foreground">
            {role.company.name} · {locationText(role)} · {ROLE_FAMILY_LABELS[role.roleFamily]}
            {role.salary.text ? ` · ${role.salary.text}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {role.status !== "approved" && (
            <Button size="xs" onClick={() => setStatus("approved")} disabled={update.isPending}>
              <Check data-icon="inline-start" />Approve
            </Button>
          )}
          {role.status !== "hidden" && (
            <Button size="xs" variant="outline" onClick={() => setStatus("hidden")} disabled={update.isPending}>
              <EyeOff data-icon="inline-start" />Hide
            </Button>
          )}
          <RoleFormDialog role={role} />
          <DeleteRoleButton role={role} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {role.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            <Badge variant="outline">{ROLE_SOURCE_LABELS[s.source]}</Badge>
            <ExternalLink className="size-3" />
          </a>
        ))}
        <span>{postedText(role)}</span>
        <span>Added {formatDistanceToNowStrict(new Date(role.createdAt), { addSuffix: true })}</span>
        {confidence !== undefined && <span>Confidence {Math.round(confidence * 100)}%</span>}
        {c?.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" />{c.email}</span>}
        {c?.whatsapp && <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" />{c.whatsapp}</span>}
        {c?.phone && c.phone !== c.whatsapp && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{c.phone}</span>}
      </div>

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-xs text-chart-3">
          {warnings.map((w) => (
            <li key={w} className="flex gap-1"><TriangleAlert className="mt-0.5 size-3 shrink-0" />{w}</li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">{role.description || "No line on the startup yet — add one with Edit."}</p>
    </Card>
  );
}

export function ListingManagement() {
  const [status, setStatus] = useState<RoleStatus>("unverified");
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAdminRoles(status, page);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={status} onValueChange={(v) => { setStatus(v as RoleStatus); setPage(1); }}>
          <TabsList>
            {ROLE_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {TAB_LABELS[s]}
                <span className="ml-1 tabular-nums text-muted-foreground">{data?.counts[s] ?? "–"}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <AddFromUrlDialog />
          <RoleFormDialog />
        </div>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <LoadingState className="min-h-64" />
      ) : data.roles.length === 0 ? (
        <EmptyState icon={Inbox} title={`No ${TAB_LABELS[status].toLowerCase()} roles`} description={EMPTY_TEXT[status]} />
      ) : (
        <div className={isPlaceholderData ? "flex flex-col gap-3 opacity-60" : "flex flex-col gap-3"}>
          {data.roles.map((role) => <QueueRow key={role.id} role={role} />)}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft data-icon="inline-start" />Previous
              </Button>
              <span className="text-muted-foreground">Page {page} of {pages}</span>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Next<ChevronRight data-icon="inline-end" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
