"use client";

/**
 * Record an interaction after a call, message, meeting or event conversation
 * (PRD §8). Also edits an existing one. Types and outcomes come from the
 * admin-managed lists in Settings & Data; an attempt does not reset the
 * contact clock.
 */
import { MessageSquarePlus, Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import type { HealthSettings, Interaction } from "@/lib/sample-data";
import { useHealthActions } from "../hooks/use-health";

export function LogInteractionDialog({
  memberId,
  memberName,
  settings,
  asOf,
  existing,
  size = "sm",
}: {
  memberId: string;
  memberName: string;
  settings: HealthSettings;
  asOf: string;
  /** Present → edit mode. */
  existing?: Interaction;
  size?: "sm" | "xs";
}) {
  const { user } = useAuth();
  const { logInteraction, updateInteraction } = useHealthActions();
  const [open, setOpen] = useState(false);
  const blank = {
    type: settings.interactionTypes[0] ?? "",
    outcome: settings.outcomes[0]?.key ?? "",
    date: asOf,
    notes: "",
    nextFollowUp: "",
  };
  const [form, setForm] = useState(existing ? { ...existing } : blank);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const pending = logInteraction.isPending || updateInteraction.isPending;

  function save() {
    const done = { onSuccess: () => setOpen(false) };
    if (existing) {
      updateInteraction.mutate({ ...existing, ...form }, done);
    } else {
      logInteraction.mutate({ ...blank, ...form, memberId, loggedBy: user?.name ?? "Admin" }, done);
      setForm(blank);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {existing ? (
        <DialogTrigger render={<Button size="icon-xs" variant="ghost" aria-label="Edit interaction" />}>
          <Pencil />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size={size} variant="outline" />}>
          <MessageSquarePlus data-icon="inline-start" />
          Log
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit interaction" : "Log an interaction"}</DialogTitle>
          <DialogDescription>With {memberName}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="li-type">Interaction type</FieldLabel>
              <NativeSelect id="li-type" className="w-full" value={form.type} onChange={(e) => set({ type: e.target.value })}>
                {settings.interactionTypes.map((t) => (
                  <NativeSelectOption key={t} value={t}>{t}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="li-date">Date</FieldLabel>
              <Input id="li-date" type="date" max={asOf} value={form.date} onChange={(e) => set({ date: e.target.value })} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="li-outcome">Outcome</FieldLabel>
            <NativeSelect id="li-outcome" className="w-full" value={form.outcome} onChange={(e) => set({ outcome: e.target.value })}>
              {settings.outcomes.map((o) => (
                <NativeSelectOption key={o.key} value={o.key}>{o.label}</NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription>
              {settings.outcomes.find((o) => o.key === form.outcome)?.meaningful
                ? "Meaningful — resets the contact clock."
                : "An attempt — tracked separately; it doesn’t reset the contact clock."}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="li-notes">Brief notes (optional)</FieldLabel>
            <Textarea id="li-notes" rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="li-next">Next follow-up date (optional)</FieldLabel>
            <Input id="li-next" type="date" value={form.nextFollowUp} onChange={(e) => set({ nextFollowUp: e.target.value })} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button onClick={save} disabled={pending || !form.type || !form.outcome || !form.date}>
            {existing ? "Save changes" : "Log interaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
