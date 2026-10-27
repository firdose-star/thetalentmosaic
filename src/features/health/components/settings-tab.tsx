"use client";

/**
 * Health › Settings & Data: everything behind the dashboard is admin-managed —
 * reminder thresholds and contact windows, relationship owners, interaction
 * types and outcomes — plus the data-quality panel, where every gap opens
 * the members behind it with an inline fix-and-save field.
 */
import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ROUTES } from "@/lib/constants";
import type { Outcome } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { useHealthActions } from "../hooks/use-health";
import { DATA_CHECKS, pct } from "../metrics";
import type { HealthData, HealthMember } from "../services/health.service";
import { CountLine, OwnerSelect } from "./health-parts";
import { ListManager } from "./list-manager";

function Thresholds({ data }: { data: HealthData }) {
  const { updateThresholds } = useHealthActions();
  const s = data.settings;
  const [form, setForm] = useState({
    t1: String(s.thresholds.t1),
    t2: String(s.thresholds.t2),
    t3: String(s.thresholds.t3),
    windows: s.windows.join(", "),
    newMemberDays: String(s.newMemberDays),
  });
  const t = [form.t1, form.t2, form.t3].map(Number);
  const windows = form.windows.split(",").map((w) => Number(w.trim())).filter((n) => n > 0);
  const valid = t.every((n) => n > 0) && t[0] < t[1] && t[1] < t[2] && windows.length > 0 && Number(form.newMemberDays) > 0;

  return (
    <Section title="Reminder thresholds" description="Drive statuses, the outreach queue and every 'overdue' number.">
      <div className="grid gap-4 @3xl/main:grid-cols-5">
        {(["t1", "t2", "t3"] as const).map((k, i) => (
          <Field key={k}>
            <FieldLabel htmlFor={`th-${k}`}>{["Check-in due after", "Priority outreach after", "At risk after"][i]}</FieldLabel>
            <Input id={`th-${k}`} type="number" min={1} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            <FieldDescription>days</FieldDescription>
          </Field>
        ))}
        <Field>
          <FieldLabel htmlFor="th-windows">Contact windows</FieldLabel>
          <Input id="th-windows" value={form.windows} onChange={(e) => setForm({ ...form, windows: e.target.value })} />
          <FieldDescription>days, comma separated</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="th-new">New-member window</FieldLabel>
          <Input id="th-new" type="number" min={1} value={form.newMemberDays} onChange={(e) => setForm({ ...form, newMemberDays: e.target.value })} />
          <FieldDescription>days</FieldDescription>
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button
          disabled={!valid || updateThresholds.isPending}
          onClick={() =>
            updateThresholds.mutate({
              thresholds: { t1: t[0], t2: t[1], t3: t[2] },
              windows: [...new Set(windows)].sort((a, b) => a - b),
              newMemberDays: Number(form.newMemberDays),
            })
          }
        >
          Save thresholds
        </Button>
        {!valid && <span className="text-xs text-destructive">Thresholds must increase, e.g. 30 → 60 → 90.</span>}
      </div>
    </Section>
  );
}

function Outcomes({ data }: { data: HealthData }) {
  const { saveOutcome, removeOutcome } = useHealthActions();
  const [editing, setEditing] = useState<Outcome | null>(null);
  const [removing, setRemoving] = useState<{ key: string; to: string } | null>(null);
  const usage = (key: string) => data.interactions.filter((x) => x.outcome === key).length;

  return (
    <Section title="Outcomes" description="Meaningful outcomes reset the contact clock; attempts are tracked separately.">
      <ul className="flex flex-col gap-1">
        {data.settings.outcomes.map((o) => {
          if (editing?.key === o.key) {
            return (
              <li key={o.key} className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5">
                <Input autoFocus value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className="h-8 flex-1" aria-label="Outcome label" />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={editing.meaningful} onCheckedChange={(v) => setEditing({ ...editing, meaningful: Boolean(v) })} />
                  Meaningful
                </label>
                <Button size="icon-sm" variant="ghost" aria-label="Save" onClick={() => {
                  if (editing.label.trim().length >= 2) saveOutcome.mutate({ ...editing, label: editing.label.trim() });
                  setEditing(null);
                }}>
                  <Check />
                </Button>
              </li>
            );
          }
          if (removing?.key === o.key) {
            const others = data.settings.outcomes.filter((x) => x.key !== o.key);
            return (
              <li key={o.key} className="flex flex-wrap items-center gap-2 rounded-lg bg-destructive/5 px-2 py-2 text-sm">
                <span className="flex-1">Remove <b>{o.label}</b>? Move its {usage(o.key)} records to</span>
                <NativeSelect size="sm" aria-label="Move records to" value={removing.to} onChange={(e) => setRemoving({ key: o.key, to: e.target.value })}>
                  {others.map((x) => <NativeSelectOption key={x.key} value={x.key}>{x.label}</NativeSelectOption>)}
                </NativeSelect>
                <Button size="sm" variant="destructive" onClick={() => {
                  removeOutcome.mutate({ key: o.key, remapTo: removing.to });
                  setRemoving(null);
                }}>
                  Remove
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
              </li>
            );
          }
          return (
            <li key={o.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
              <span className="flex-1 text-sm">{o.label}</span>
              <Badge variant={o.meaningful ? "secondary" : "outline"}>{o.meaningful ? "Meaningful" : "Attempt"}</Badge>
              <Badge variant="outline" className="tabular-nums">{usage(o.key)} records</Badge>
              <Button size="icon-sm" variant="ghost" aria-label={`Edit ${o.label}`} onClick={() => setEditing(o)}><Pencil /></Button>
              <Button size="icon-sm" variant="ghost" aria-label={`Remove ${o.label}`} disabled={data.settings.outcomes.length === 1} onClick={() => {
                const fallback = data.settings.outcomes.find((x) => x.key !== o.key)?.key ?? "";
                if (usage(o.key) === 0) removeOutcome.mutate({ key: o.key, remapTo: fallback });
                else setRemoving({ key: o.key, to: fallback });
              }}>
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        variant="outline"
        className="mt-2"
        onClick={() => setEditing({ key: `custom-${Date.now()}`, label: "New outcome", meaningful: true })}
      >
        <Plus data-icon="inline-start" />
        Add outcome
      </Button>
      {editing && !data.settings.outcomes.some((o) => o.key === editing.key) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input autoFocus value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className="h-8 flex-1" aria-label="New outcome label" />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={editing.meaningful} onCheckedChange={(v) => setEditing({ ...editing, meaningful: Boolean(v) })} />
            Meaningful
          </label>
          <Button size="sm" onClick={() => {
            if (editing.label.trim().length >= 2) saveOutcome.mutate({ ...editing, label: editing.label.trim() });
            setEditing(null);
          }}>
            Save
          </Button>
        </div>
      )}
    </Section>
  );
}

/** One inline fix for one member and one missing field. */
function FixField({ member, field, owners }: { member: HealthMember; field: (typeof DATA_CHECKS)[number]["field"]; owners: string[] }) {
  const { updateMember } = useHealthActions();
  const [value, setValue] = useState("");
  if (!field) return <span className="text-xs text-muted-foreground">Ask the member — they can share it from their profile</span>;
  if (field === "owner") return <OwnerSelect member={member} owners={owners} />;

  const placeholder = { linkedin: "linkedin.com/in/…", whatsapp: "10-digit mobile", interests: "Comma separated", hobbies: "Comma separated" }[field];
  const save = () => {
    const v = value.trim();
    if (!v) return;
    const patch =
      field === "interests" || field === "hobbies"
        ? { [field]: v.split(",").map((x) => x.trim()).filter(Boolean) }
        : { [field]: v.replace(/^https?:\/\//, "") };
    updateMember.mutate({ memberId: member.id, patch });
  };

  return (
    <div className="flex gap-1.5">
      <Input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder={placeholder} className="h-8 w-56" aria-label={`${field} for ${member.name}`} />
      <Button size="sm" variant="outline" onClick={save} disabled={!value.trim()}>Save</Button>
    </div>
  );
}

export function DataQuality({ data, list }: { data: HealthData; list: HealthMember[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Section title="Data quality" description="Each gap opens the members behind it, with a field to fix and save right there.">
      <ul className="flex flex-col divide-y">
        {DATA_CHECKS.map((check) => {
          const members = list.filter(check.test);
          const isOpen = open === check.key;
          return (
            <li key={check.key} className="py-2 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : check.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
              >
                <span className="flex-1 font-medium">{check.label}</span>
                <span className="text-sm tabular-nums">
                  <span className={cn("font-semibold", members.length > 0 && "text-destructive")}>{members.length}</span>
                  <span className="text-muted-foreground">/{list.length} · {pct(members.length, list.length)}</span>
                </span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="mt-2 flex flex-col gap-2 px-2">
                  <CountLine count={members.length} total={list.length} label={check.label} />
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">All clear. 🎉</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {members.map((m) => (
                        <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-2">
                          <Link href={`${ROUTES.people}/${m.id}`} className="flex min-w-48 flex-1 items-center gap-2 hover:underline">
                            <MemberAvatar name={m.name} className="size-7" />
                            <span>
                              <span className="block text-sm font-medium">{m.name}</span>
                              <span className="block text-xs text-muted-foreground">{m.startup} · {m.owner ?? "Unassigned"}</span>
                            </span>
                          </Link>
                          <FixField member={m} field={check.field} owners={data.settings.owners} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function SettingsTab({ data, list }: { data: HealthData; list: HealthMember[] }) {
  const actions = useHealthActions();

  return (
    <div className="flex flex-col gap-4">
      <DataQuality data={data} list={list} />
      <Thresholds data={data} />
      <div className="grid items-start gap-4 @4xl/main:grid-cols-2">
        <Section title="Relationship owners" description="Removing an owner reassigns their members.">
          <ListManager
            items={data.settings.owners}
            usage={(o) => data.members.filter((m) => m.owner === o).length}
            noun="members"
            allowUnassign
            onAdd={(name) => actions.addOwner.mutate(name)}
            onRename={(from, to) => actions.renameOwner.mutate({ from, to })}
            onRemove={(name, to) => actions.removeOwner.mutate({ name, reassignTo: to })}
          />
        </Section>
        <Section title="Interaction types" description="The options in 'Log an interaction'.">
          <ListManager
            items={data.settings.interactionTypes}
            usage={(t) => data.interactions.filter((x) => x.type === t).length}
            noun="records"
            onAdd={(name) => actions.addType.mutate(name)}
            onRename={(from, to) => actions.renameType.mutate({ from, to })}
            onRemove={(name, to) => actions.removeType.mutate({ name, remapTo: to ?? "" })}
          />
        </Section>
      </div>
      <Outcomes data={data} />
    </div>
  );
}
