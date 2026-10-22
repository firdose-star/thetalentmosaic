"use client";

/**
 * Submissions & Approvals (PRD §7): one queue for vendor suggestions,
 * resource recommendations, member-hosted sessions and birthday messages.
 * Only approved items appear to members. Approve, edit, or reject with a
 * reason — each decision goes in the activity log.
 */
import { Check, Inbox, Pencil } from "lucide-react";
import { useState } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEventAdminActions } from "@/features/events";
import { BirthdayMessages } from "@/features/overview";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { shortDate } from "@/lib/community";
import type { VendorSuggestion } from "@/lib/sample-data";
import { useAdminActions, useAdminData } from "../hooks/use-admin";
import type { AdminData } from "../services/admin.service";
import { DeclineDialog, TabCount } from "./admin-parts";

function Submitted({ by, on }: { by: string; on: string }) {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <MemberAvatar name={by} className="size-5" />
      Suggested by <span className="text-foreground">{by}</span> · {shortDate(on, true)}
    </span>
  );
}

function EditVendorDialog({ suggestion }: { suggestion: VendorSuggestion }) {
  const { editVendorSuggestion } = useAdminActions();
  const [open, setOpen] = useState(false);
  const fields = ["name", "category", "city", "area", "phone", "website", "email", "instagram"] as const;
  const [form, setForm] = useState({ ...suggestion.vendor });

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setForm({ ...suggestion.vendor }); }}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <Pencil data-icon="inline-start" />
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit before publishing</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((key) => (
              <Field key={key}>
                <FieldLabel htmlFor={`vs-${key}`} className="capitalize">{key}</FieldLabel>
                <Input id={`vs-${key}`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </Field>
            ))}
          </div>
          <Field>
            <FieldLabel htmlFor="vs-description">Description</FieldLabel>
            <Textarea id="vs-description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button onClick={() => editVendorSuggestion.mutate({ id: suggestion.id, patch: form }, { onSuccess: () => setOpen(false) })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Vendors({ data }: { data: AdminData }) {
  const { approveVendor, rejectVendor } = useAdminActions();
  const pending = data.vendorSuggestions.filter((s) => s.status === "pending");
  const declined = data.vendorSuggestions.filter((s) => s.status === "rejected");

  return (
    <div className="flex flex-col gap-3">
      {pending.length === 0 && <EmptyState icon={Inbox} title="No vendor suggestions waiting" />}
      {pending.map((s) => (
        <Card key={s.id} className="gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{s.vendor.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{s.vendor.category}</Badge>
                <Badge variant="outline">{s.vendor.city}{s.vendor.area ? ` · ${s.vendor.area}` : ""}</Badge>
              </div>
            </div>
            <Submitted by={s.submittedBy} on={s.submittedOn} />
          </div>
          {s.vendor.description && <p className="text-sm text-muted-foreground">{s.vendor.description}</p>}
          <p className="text-xs text-muted-foreground">
            {[s.vendor.website, s.vendor.phone && `+91 ${s.vendor.phone}`, s.vendor.email, s.vendor.instagram && `@${s.vendor.instagram}`].filter(Boolean).join(" · ") || "No contact details yet — add them before publishing."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => approveVendor.mutate({ id: s.id })}>
              <Check data-icon="inline-start" />
              Approve and publish
            </Button>
            <EditVendorDialog suggestion={s} />
            <DeclineDialog title={`Decline ${s.vendor.name}?`} onConfirm={(reason) => rejectVendor.mutate({ id: s.id, reason })} />
          </div>
        </Card>
      ))}
      {declined.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Declined: {declined.map((d) => `${d.vendor.name}${d.reason ? ` (${d.reason})` : ""}`).join(", ")}
        </p>
      )}
    </div>
  );
}

function Resources({ data }: { data: AdminData }) {
  const { approveRecommendation, rejectRecommendation } = useAdminActions();
  const pending = data.recommendations.filter((r) => r.status === "Under review");
  const declined = data.recommendations.filter((r) => r.status === "Not approved");

  return (
    <div className="flex flex-col gap-3">
      {pending.length === 0 && <EmptyState icon={Inbox} title="No resources waiting" />}
      {pending.map((r) => (
        <Card key={r.id} className="gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{r.title}</p>
              {r.category && <Badge variant="secondary" className="mt-1">{r.category}</Badge>}
            </div>
            <Submitted by={r.owner} on={r.submittedOn} />
          </div>
          <p className="text-sm text-muted-foreground">{r.description}</p>
          {(r.fileName || r.link) && <p className="text-xs text-muted-foreground">{[r.fileName, r.link].filter(Boolean).join(" · ")}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => approveRecommendation.mutate({ id: r.id })}>
              <Check data-icon="inline-start" />
              Approve and publish
            </Button>
            <DeclineDialog title={`Decline "${r.title}"?`} onConfirm={(reason) => rejectRecommendation.mutate({ id: r.id, reason })} />
          </div>
        </Card>
      ))}
      {declined.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Declined: {declined.map((d) => `${d.title}${d.reason ? ` (${d.reason})` : ""}`).join(", ")}
        </p>
      )}
    </div>
  );
}

function HostedSessions({ data }: { data: AdminData }) {
  const { review } = useEventAdminActions();
  const pending = data.hostedSubmissions.filter((s) => s.status === "pending");

  if (pending.length === 0) {
    return <EmptyState icon={Inbox} title="No hosted sessions waiting" description="Members submit these from Events › Hosting a session?" />;
  }
  return (
    <div className="flex flex-col gap-3">
      {pending.map((s) => (
        <Card key={s.id} className="gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-muted-foreground">
                {shortDate(s.date, true)} · {s.time} · 📍 {s.city} · {s.format} · {s.cost === "Free" ? "Free" : `Paid · ${s.price}`}
              </p>
            </div>
            <Submitted by={s.hostName} on={s.submittedOn} />
          </div>
          <p className="text-sm">{s.details}</p>
          <p className="text-xs text-muted-foreground">Registration: {s.registrationUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => review.mutate({ id: s.id, approve: true })}>
              <Check data-icon="inline-start" />
              Approve and publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => review.mutate({ id: s.id, approve: false })}>Reject</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function Submissions() {
  const { values, set } = useUrlFilters(["tab"] as const);
  const { data, isPending, isError, error, refetch } = useAdminData();
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  return (
    <Tabs value={values.tab || "vendors"} onValueChange={(v) => set("tab", v === "vendors" ? "" : String(v))}>
      <div className="overflow-x-auto pb-1">
        <TabsList>
          <TabsTrigger value="vendors">Vendors <TabCount n={data.vendorSuggestions.filter((s) => s.status === "pending").length} /></TabsTrigger>
          <TabsTrigger value="resources">Resources <TabCount n={data.recommendations.filter((r) => r.status === "Under review").length} /></TabsTrigger>
          <TabsTrigger value="sessions">Hosted sessions <TabCount n={data.hostedSubmissions.filter((s) => s.status === "pending").length} /></TabsTrigger>
          <TabsTrigger value="birthdays">Birthday messages <TabCount n={data.overview.birthdaysToApprove} /></TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="vendors" className="mt-4"><Vendors data={data} /></TabsContent>
      <TabsContent value="resources" className="mt-4"><Resources data={data} /></TabsContent>
      <TabsContent value="sessions" className="mt-4"><HostedSessions data={data} /></TabsContent>
      <TabsContent value="birthdays" className="mt-4"><BirthdayMessages /></TabsContent>
    </Tabs>
  );
}
