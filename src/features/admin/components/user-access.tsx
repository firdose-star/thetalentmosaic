"use client";

/**
 * User Access (PRD §7): everyone who can sign in — the admin team,
 * relationship owners and every member, with their real last activity.
 * Change roles, deactivate or reactivate, invite people, and decide what each
 * role may do.
 */
import { UserPlus } from "lucide-react";
import { useState } from "react";

import { FilterSelect, SearchInput } from "@/components/shared/filter-bar";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ACCESS_ROLES, type AccessRole } from "@/lib/sample-data";
import { useAdminActions, useAdminData } from "../hooks/use-admin";
import type { AdminData } from "../services/admin.service";
import { whenText } from "./admin-parts";

const STATUS_TONE = { Active: "bg-accent text-primary", Invited: "bg-chart-3/20 text-foreground", Deactivated: "bg-destructive/10 text-destructive" };

function InviteDialog() {
  const { invite } = useAdminActions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Member" as AccessRole });
  const valid = form.name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(form.email);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlus data-icon="inline-start" />
        Invite someone
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite someone</DialogTitle>
          <DialogDescription>They get a sign-in link by email.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="inv-name">Name</FieldLabel>
            <Input id="inv-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inv-email">Email</FieldLabel>
            <Input id="inv-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inv-role">Role</FieldLabel>
            <NativeSelect id="inv-role" className="w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AccessRole })}>
              {ACCESS_ROLES.map((r) => <NativeSelectOption key={r} value={r}>{r}</NativeSelectOption>)}
            </NativeSelect>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            disabled={!valid || invite.isPending}
            onClick={() => invite.mutate({ name: form.name.trim(), email: form.email.trim(), role: form.role }, { onSuccess: () => { setOpen(false); setForm({ name: "", email: "", role: "Member" }); } })}
          >
            Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Users({ data }: { data: AdminData }) {
  const { setUserAccess } = useAdminActions();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const q = query.trim().toLowerCase();
  const rows = data.users.filter(
    (u) => (!role || u.role === role) && (!status || u.status === status) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)),
  );
  const count = (r: AccessRole) => data.users.filter((u) => u.role === r && u.status !== "Deactivated").length;

  return (
    <Section
      title="People with access"
      description={`${count("Admin")} admins · ${count("Relationship owner")} relationship owners · ${count("Member")} members`}
      actions={<InviteDialog />}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 @3xl/main:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name or email" className="flex-1" />
          <div className="grid grid-cols-2 gap-2 @3xl/main:w-96">
            <FilterSelect label="Role" allLabel="All roles" value={role} options={ACCESS_ROLES} onChange={setRole} />
            <FilterSelect label="Status" allLabel="All statuses" value={status} options={["Active", "Invited", "Deactivated"]} onChange={setStatus} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground"><span className="text-base font-semibold text-foreground">{rows.length}</span> of {data.users.length} people</p>
        <Card className="max-h-[32rem] overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <MemberAvatar name={u.name} className="size-7" />
                      <span>
                        <span className="block font-medium">{u.name}</span>
                        <span className="block text-xs text-muted-foreground">{u.email}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <NativeSelect size="sm" aria-label={`Role for ${u.name}`} value={u.role} onChange={(e) => setUserAccess.mutate({ id: u.id, patch: { role: e.target.value as AccessRole } })} className="w-40">
                      {ACCESS_ROLES.map((r) => <NativeSelectOption key={r} value={r}>{r}</NativeSelectOption>)}
                    </NativeSelect>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{whenText(u.lastActiveAt)}</TableCell>
                  <TableCell><Badge className={STATUS_TONE[u.status]}>{u.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {u.status === "Deactivated" ? (
                      <Button size="xs" variant="outline" onClick={() => setUserAccess.mutate({ id: u.id, patch: { status: "Active" } })}>Reactivate</Button>
                    ) : (
                      <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setUserAccess.mutate({ id: u.id, patch: { status: "Deactivated" } })}>Deactivate</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Section>
  );
}

function Permissions({ data }: { data: AdminData }) {
  const { togglePermission } = useAdminActions();
  return (
    <Section title="Permissions by role" description="Tick what each role may do. Admin keeps access management and the activity log so nobody gets locked out.">
      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              {ACCESS_ROLES.map((r) => <TableHead key={r} className="text-center">{r}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.permissions.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-normal">{p.label}</TableCell>
                {ACCESS_ROLES.map((r) => (
                  <TableCell key={r} className="text-center">
                    <Checkbox
                      checked={p.roles[r]}
                      disabled={p.locked && r === "Admin"}
                      onCheckedChange={() => togglePermission.mutate({ id: p.id, role: r })}
                      aria-label={`${r}: ${p.label}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Section>
  );
}

export function UserAccess() {
  const { data, isPending, isError, error, refetch } = useAdminData();
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;
  return (
    <div className="flex flex-col gap-4">
      <Users data={data} />
      <Permissions data={data} />
    </div>
  );
}
