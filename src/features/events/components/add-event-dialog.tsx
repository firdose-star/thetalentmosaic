"use client";

/**
 * Admin-only: add an event directly — no approval step. A future date lands
 * in Upcoming Events; a past date goes straight onto the timeline, ready for
 * winners and attendance to be tagged. Render inside a RoleGuard.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useEventAdminActions } from "../hooks/use-events";
import { adminEventSchema, type AdminEventInput } from "../schemas";

const DEFAULTS: AdminEventInput = {
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
};

export function AddEventDialog() {
  const [open, setOpen] = useState(false);
  const { create } = useEventAdminActions();
  const form = useForm<AdminEventInput>({ resolver: zodResolver(adminEventSchema), defaultValues: DEFAULTS });
  const errors = form.formState.errors;

  async function onSubmit(values: AdminEventInput) {
    await create.mutateAsync(values);
    form.reset(DEFAULTS);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <CalendarPlus data-icon="inline-start" />
        Add event
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an event</DialogTitle>
          <DialogDescription>Hosted by The Talent Mosaic. Publishes straight away.</DialogDescription>
        </DialogHeader>
        <form id="admin-event" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ae-title">Event name</FieldLabel>
              <Input id="ae-title" aria-invalid={!!errors.title} {...form.register("title")} />
              <FieldError errors={[errors.title]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="ae-date">Date</FieldLabel>
                <Input id="ae-date" type="date" aria-invalid={!!errors.date} {...form.register("date")} />
                <FieldError errors={[errors.date]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ae-time">Time</FieldLabel>
                <Input id="ae-time" type="time" {...form.register("time")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ae-format">Format</FieldLabel>
                <NativeSelect id="ae-format" className="w-full" {...form.register("format")}>
                  <NativeSelectOption value="In person">In person</NativeSelectOption>
                  <NativeSelectOption value="Online">Online</NativeSelectOption>
                  <NativeSelectOption value="Hybrid">Hybrid</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ae-city">City</FieldLabel>
                <Input id="ae-city" aria-invalid={!!errors.city} {...form.register("city")} />
                <FieldError errors={[errors.city]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ae-category">Category</FieldLabel>
                <Input id="ae-category" placeholder="Mixer, Workshop…" aria-invalid={!!errors.category} {...form.register("category")} />
                <FieldError errors={[errors.category]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="ae-venue">Full venue</FieldLabel>
              <Input id="ae-venue" {...form.register("venue")} />
              <FieldDescription>Admins only — members see the city.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="ae-description">Description</FieldLabel>
              <Textarea id="ae-description" rows={3} aria-invalid={!!errors.description} {...form.register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ae-link">Registration link</FieldLabel>
                <Input id="ae-link" placeholder="https://" aria-invalid={!!errors.registrationUrl} {...form.register("registrationUrl")} />
                <FieldError errors={[errors.registrationUrl]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ae-cost">Cost</FieldLabel>
                <Input id="ae-cost" placeholder="Free, or ₹500" {...form.register("cost")} />
              </Field>
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="admin-event" disabled={create.isPending}>Add event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
