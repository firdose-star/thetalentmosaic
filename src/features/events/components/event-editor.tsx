"use client";

/**
 * Admin event controls. Render inside `<RoleGuard allow={["admin"]}>`.
 *  - EventFormDialog: add an event, or edit every detail of one.
 *  - DeleteEventButton: remove an event (and untag it from members).
 *  - AttendeesDialog: tick exactly which members attended.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Pencil, Trash2, UsersRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Button } from "@/components/ui/button";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { CommunityEvent } from "@/types/community";
import { useEventAdminActions, useEventAttendees } from "../hooks/use-events";
import { adminEventSchema, type AdminEventInput } from "../schemas";

const EMPTY: AdminEventInput = {
  title: "",
  date: "",
  time: "",
  format: "In person",
  city: "",
  venue: "",
  category: "",
  description: "",
  registrationUrl: "",
  cost: "",
  momentsUrl: "",
  photosUrl: "",
};

/** "6:30 PM" → "18:30" for the time input. */
function to24h(value?: string) {
  const m = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return "";
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

const fromEvent = (e: CommunityEvent): AdminEventInput => ({
  title: e.title,
  date: e.date,
  time: to24h(e.time),
  format: e.format,
  city: e.city,
  venue: e.venue ?? "",
  category: e.category,
  description: e.description,
  registrationUrl: e.registrationUrl ?? "",
  cost: e.cost ?? "",
  momentsUrl: e.momentsUrl ?? "",
  photosUrl: e.photosUrl ?? "",
});

export function EventFormDialog({ event, size = "default" }: { event?: CommunityEvent; size?: "default" | "sm" }) {
  const isEdit = Boolean(event);
  const [open, setOpen] = useState(false);
  const { create, update } = useEventAdminActions();
  const form = useForm<AdminEventInput>({ resolver: zodResolver(adminEventSchema), defaultValues: event ? fromEvent(event) : EMPTY });
  const errors = form.formState.errors;
  const id = event?.id ?? "new";

  async function onSubmit(values: AdminEventInput) {
    if (event) await update.mutateAsync({ id: event.id, input: values });
    else {
      await create.mutateAsync(values);
      form.reset(EMPTY);
    }
    setOpen(false);
  }

  const text = (key: keyof AdminEventInput, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Field>
      <FieldLabel htmlFor={`ev-${id}-${key}`}>{label}</FieldLabel>
      <Input id={`ev-${id}-${key}`} aria-invalid={!!errors[key]} {...form.register(key)} {...props} />
      <FieldError errors={[errors[key]]} />
    </Field>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(event ? fromEvent(event) : EMPTY);
      }}
    >
      {isEdit ? (
        <DialogTrigger render={<Button size="sm" variant="outline" />}>
          <Pencil data-icon="inline-start" />
          Edit
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size={size} variant="outline" />}>
          <CalendarPlus data-icon="inline-start" />
          Add event
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${event?.title}` : "Add an event"}</DialogTitle>
          <DialogDescription>Hosted by The Talent Mosaic. A past date puts it on the timeline; a future date under Upcoming.</DialogDescription>
        </DialogHeader>
        <form id={`event-form-${id}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {text("title", "Event name")}
            <div className="grid gap-4 sm:grid-cols-3">
              {text("date", "Date", { type: "date" })}
              {text("time", "Time", { type: "time" })}
              <Field>
                <FieldLabel htmlFor={`ev-${id}-format`}>Format</FieldLabel>
                <NativeSelect id={`ev-${id}-format`} className="w-full" {...form.register("format")}>
                  <NativeSelectOption value="In person">In person</NativeSelectOption>
                  <NativeSelectOption value="Online">Online</NativeSelectOption>
                  <NativeSelectOption value="Hybrid">Hybrid</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("city", "City", { placeholder: "Bangalore, or Online" })}
              {text("category", "Category", { placeholder: "Toast to Talent, Talentable…" })}
            </div>
            <Field>
              <FieldLabel htmlFor={`ev-${id}-venue`}>Venue / area</FieldLabel>
              <Input id={`ev-${id}-venue`} placeholder="Koramangala, Bangalore" {...form.register("venue")} />
              <FieldDescription>Admins only — members see the city.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`ev-${id}-description`}>Description</FieldLabel>
              <Textarea id={`ev-${id}-description`} rows={3} aria-invalid={!!errors.description} {...form.register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("registrationUrl", "Registration link", { placeholder: "https://" })}
              {text("cost", "Cost", { placeholder: "Free, or ₹500" })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("momentsUrl", "Moments (Drive link)", { placeholder: "https://drive.google.com/…" })}
              {text("photosUrl", "Photos folder (Drive link)", { placeholder: "https://drive.google.com/…" })}
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form={`event-form-${id}`} disabled={create.isPending || update.isPending}>
            {isEdit ? "Save event" : "Add event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteEventButton({ event, onDeleted }: { event: CommunityEvent; onDeleted?: () => void }) {
  const [open, setOpen] = useState(false);
  const { remove } = useEventAdminActions();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" className="text-destructive" />}>
        <Trash2 data-icon="inline-start" />
        Delete
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {event.title}?</DialogTitle>
          <DialogDescription>It disappears from Events and from every member’s attendance. This can’t be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Keep it</Button>
          <Button variant="destructive" onClick={() => remove.mutate(event.id, { onSuccess: () => { setOpen(false); onDeleted?.(); } })}>
            Delete event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AttendeesDialog({ event }: { event: CommunityEvent }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[] | null>(null);
  const { data } = useEventAttendees(event.id, open);
  const { attendees } = useEventAdminActions();
  const chosen = selected ?? data?.filter((m) => m.attended).map((m) => m.id) ?? [];
  const q = query.trim().toLowerCase();
  const visible = (data ?? []).filter((m) => !q || `${m.name} ${m.startup}`.toLowerCase().includes(q));
  const toggle = (id: string) => setSelected(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSelected(null);
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <UsersRound data-icon="inline-start" />
        Attendees{event.attended ? ` (${event.attended})` : ""}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Who attended {event.title}?</DialogTitle>
          <DialogDescription>Tick everyone who came. Their profiles, engagement tiers and Health update straight away.</DialogDescription>
        </DialogHeader>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or startup" aria-label="Search members" />
        <ul className="flex max-h-80 flex-col overflow-y-auto">
          {visible.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted">
                <Checkbox checked={chosen.includes(m.id)} onCheckedChange={() => toggle(m.id)} />
                <MemberAvatar name={m.name} className="size-7" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{m.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{m.startup}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <span className="mr-auto self-center text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{chosen.length}</span> attended
          </span>
          <Button onClick={() => attendees.mutate({ eventId: event.id, memberIds: chosen }, { onSuccess: () => setOpen(false) })} disabled={attendees.isPending}>
            Save attendees
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
