"use client";

/**
 * Member Management (PRD §7): edit any member record, review new
 * registrations, profile change and contact requests, spot duplicates and
 * fix missing data. Changes land in the shared records — People, Health and
 * Overview update at once — and in the activity log.
 */
import { Check, Pencil, Search, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FilterSelect, SearchInput } from "@/components/shared/filter-bar";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataQualityPanel, MemberEngagementButton, MemberOwnerSelect } from "@/features/health";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { shortDate } from "@/lib/community";
import { ROUTES } from "@/lib/constants";
import { MEMBER_STATUSES, type MemberStatus } from "@/types/community";
import { useAdminActions, useAdminData } from "../hooks/use-admin";
import type { AdminData, AdminMember } from "../services/admin.service";
import { DeclineDialog, TabCount } from "./admin-parts";

const EDITABLE = [
  { key: "name", label: "Name" },
  { key: "designation", label: "Designation" },
  { key: "startup", label: "Startup" },
  { key: "city", label: "City" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "interests", label: "Interests (comma separated)" },
  { key: "hobbies", label: "Hobbies (comma separated)" },
] as const;

function EditMemberDialog({ member }: { member: AdminMember }) {
  const { editMember } = useAdminActions();
  const [open, setOpen] = useState(false);
  const initial = () =>
    Object.fromEntries(
      EDITABLE.map(({ key }) => [key, Array.isArray(member[key]) ? (member[key] as string[]).join(", ") : String(member[key] ?? "")]),
    ) as Record<(typeof EDITABLE)[number]["key"], string>;
  const [form, setForm] = useState(initial);

  function save() {
    const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
    editMember.mutate(
      {
        id: member.id,
        patch: { ...form, interests: list(form.interests), hobbies: list(form.hobbies) },
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setForm(initial()); }}>
      <DialogTrigger render={<Button size="xs" variant="ghost" />}>
        <Pencil data-icon="inline-start" />
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {member.name}</DialogTitle>
          <DialogDescription>Corrections publish straight away and are recorded in the activity log.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            {EDITABLE.map(({ key, label }) => (
              <Field key={key} className={key === "interests" || key === "hobbies" ? "sm:col-span-2" : undefined}>
                <FieldLabel htmlFor={`em-${key}`}>{label}</FieldLabel>
                <Input id={`em-${key}`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </Field>
            ))}
          </div>
        </FieldGroup>
        <DialogFooter>
          <Button onClick={save} disabled={editMember.isPending || !form.name.trim()}>Save record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AllRecords({ data }: { data: AdminData }) {
  const { setMemberStatus } = useAdminActions();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [owner, setOwner] = useState("");
  const [added, setAdded] = useState("");
  const q = query.trim().toLowerCase();
  const rows = data.members
    .filter(
      (m) =>
        (!status || m.status === status) &&
        (!owner || (owner === "__none" ? !m.owner : m.owner === owner)) &&
        (!added || (m.addedToCommunity ?? "Not recorded") === added) &&
        (!q || `${m.name} ${m.startup} ${m.city} ${m.email}`.toLowerCase().includes(q)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-3">
      <Card className="gap-2 p-4 @3xl/main:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, startup, city or email" className="flex-1" />
        <div className="grid grid-cols-2 gap-2 @3xl/main:w-[36rem] @3xl/main:grid-cols-3">
          <FilterSelect label="Status" allLabel="All statuses" value={status} options={MEMBER_STATUSES} onChange={setStatus} />
          <FilterSelect label="Owner" allLabel="All owners" value={owner} options={[...data.owners.map((o) => ({ value: o, label: o })), { value: "__none", label: "Unassigned" }]} onChange={setOwner} />
          <FilterSelect label="Added to community" allLabel="Added to community: any" value={added} options={[...new Set(data.members.map((x) => x.addedToCommunity ?? "Not recorded"))].sort()} onChange={setAdded} />
        </div>
      </Card>
      <p className="text-sm text-muted-foreground">
        <span className="text-base font-semibold text-foreground">{rows.length}</span> of {data.members.length} member records
      </p>
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Missing data</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Link href={`${ROUTES.people}/${m.id}`} className="flex items-center gap-2.5 hover:underline">
                    <MemberAvatar name={m.name} className="size-7" />
                    <span>
                      <span className="block font-medium">{m.name}</span>
                      <span className="block text-xs text-muted-foreground">{m.designation} · {m.startup}</span>
                      <span className="mt-0.5 flex flex-wrap gap-1">
                        {m.addedToCommunity && <Badge variant="outline" className="text-[0.625rem]">Added to community: {m.addedToCommunity}</Badge>}
                        {m.directoryConsent === false && <Badge className="bg-chart-3/20 text-[0.625rem] text-foreground">Hidden from directory</Badge>}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>{m.city}</TableCell>
                <TableCell className="text-xs tabular-nums">{shortDate(m.joinedOn, true)}</TableCell>
                <TableCell>
                  <NativeSelect size="sm" aria-label={`Status for ${m.name}`} value={m.status} onChange={(e) => setMemberStatus.mutate({ id: m.id, status: e.target.value as MemberStatus })} className="w-28">
                    {MEMBER_STATUSES.map((s) => <NativeSelectOption key={s} value={s}>{s}</NativeSelectOption>)}
                  </NativeSelect>
                </TableCell>
                <TableCell><MemberOwnerSelect memberId={m.id} memberName={m.name} /></TableCell>
                <TableCell>
                  {m.missing.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Complete</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {m.missing.map((g) => <Badge key={g} variant="outline" className="border-chart-3/50 text-chart-3">{g}</Badge>)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <EditMemberDialog member={m} />
                    <MemberEngagementButton memberId={m.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Registrations({ data }: { data: AdminData }) {
  const { approveRegistration, rejectRegistration } = useAdminActions();
  if (data.registrations.length === 0) return <EmptyState icon={UserCheck} title="No registrations waiting" description="New sign-ups will appear here for approval." />;

  return (
    <div className="grid gap-3 @4xl/main:grid-cols-2">
      {data.registrations.map((r) => (
        <Card key={r.id} className="gap-3 p-5">
          <div className="flex items-start gap-3">
            <MemberAvatar name={r.name} className="size-11" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.name}</p>
              <p className="text-sm text-muted-foreground">{r.designation} · {r.startup} · {r.city}</p>
              <p className="text-xs text-muted-foreground">{r.email} · received {r.receivedAt}</p>
            </div>
            <Badge className={r.verifiedDomain ? "bg-accent text-primary" : "bg-chart-3/20 text-foreground"}>
              {r.verifiedDomain ? "Startup email" : "Personal email — verify"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => approveRegistration.mutate({ id: r.id })}>
              <Check data-icon="inline-start" />
              Approve
            </Button>
            <DeclineDialog title={`Decline ${r.name}?`} label="Decline" onConfirm={(reason) => rejectRegistration.mutate({ id: r.id, reason })} />
          </div>
          <p className="text-xs text-muted-foreground">Approving adds them to People and assigns the owner with the fewest members.</p>
        </Card>
      ))}
    </div>
  );
}

function Requests({ data }: { data: AdminData }) {
  const { applyProfileChange, declineProfileChange, resolveContactRequest } = useAdminActions();

  return (
    <div className="flex flex-col gap-4">
      <Section title="Profile change requests" description="Members asked for these updates. The live profile changes only when you apply them.">
        {data.profileChanges.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing waiting.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {data.profileChanges.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Link href={`${ROUTES.people}/${c.memberId}`} className="font-medium hover:underline">{c.memberName}</Link>
                  <p className="text-sm">
                    {c.field}: <span className="text-muted-foreground line-through">{c.current}</span> → <span className="font-medium">{c.to}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Requested {c.requestedAt}</p>
                </div>
                <Button size="sm" onClick={() => applyProfileChange.mutate({ id: c.id })}>
                  <Check data-icon="inline-start" />
                  Apply
                </Button>
                <DeclineDialog title={`Decline ${c.memberName}'s change?`} label="Decline" onConfirm={(reason) => declineProfileChange.mutate({ id: c.id, reason })} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Contact detail requests" description="Members asking to be introduced. Share only with the other member's consent.">
        {data.contactRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing waiting.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {data.contactRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{r.requestedBy}</span> would like <span className="font-medium">{r.memberName}</span>’s contact details
                  <span className="block text-xs text-muted-foreground">Requested {r.requestedAt}</span>
                </p>
                <Button size="sm" onClick={() => resolveContactRequest.mutate({ id: r.id, share: true })}>Share</Button>
                <Button size="sm" variant="outline" onClick={() => resolveContactRequest.mutate({ id: r.id, share: false })}>Decline</Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Duplicates({ data }: { data: AdminData }) {
  const { resolveDuplicate } = useAdminActions();
  if (data.duplicates.length === 0) return <EmptyState icon={Search} title="No possible duplicates" description="Checked on email, WhatsApp number, and name plus startup." />;

  return (
    <div className="flex flex-col gap-3">
      {data.duplicates.map((d) => (
        <Card key={d.id} className="gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm"><span className="font-semibold">{d.match}% match</span> · {d.reason}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => resolveDuplicate.mutate({ id: d.id, merge: true })}>Merge into the CRM record</Button>
              <Button size="sm" variant="outline" onClick={() => resolveDuplicate.mutate({ id: d.id, merge: false })}>Keep both</Button>
            </div>
          </div>
          <div className="grid gap-2 @2xl/main:grid-cols-2">
            {[{ label: "In the CRM", r: d.a }, { label: "Possible duplicate", r: d.b }].map(({ label, r }) => (
              <div key={label} className="rounded-lg border p-3 text-sm">
                <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
                {r ? (
                  <>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-muted-foreground">{r.email}</p>
                    <p className="text-muted-foreground">{r.startup} · {r.city}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Record no longer exists</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MemberManagement() {
  const { values, set } = useUrlFilters(["tab"] as const);
  const { data, isPending, isError, error, refetch } = useAdminData();
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  return (
    <Tabs value={values.tab || "all"} onValueChange={(v) => set("tab", v === "all" ? "" : String(v))}>
      <div className="overflow-x-auto pb-1">
        <TabsList>
          <TabsTrigger value="all">All records <TabCount n={data.members.length} /></TabsTrigger>
          <TabsTrigger value="registrations">Registrations <TabCount n={data.registrations.length} /></TabsTrigger>
          <TabsTrigger value="requests">Requests <TabCount n={data.profileChanges.length + data.contactRequests.length} /></TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates <TabCount n={data.duplicates.length} /></TabsTrigger>
          <TabsTrigger value="missing">Missing data <TabCount n={data.overview.missingData} /></TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="all" className="mt-4"><AllRecords data={data} /></TabsContent>
      <TabsContent value="registrations" className="mt-4"><Registrations data={data} /></TabsContent>
      <TabsContent value="requests" className="mt-4"><Requests data={data} /></TabsContent>
      <TabsContent value="duplicates" className="mt-4"><Duplicates data={data} /></TabsContent>
      <TabsContent value="missing" className="mt-4"><DataQualityPanel /></TabsContent>
    </Tabs>
  );
}
