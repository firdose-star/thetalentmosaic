"use client";

/**
 * "Hosting a session?" — any member tells the community about an event they
 * are running: name, location, details, registration link, free or paid. It
 * publishes after admin approval with "Hosted by <name>, a Community Member".
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useHostSession } from "../hooks/use-events";
import { hostSessionSchema, type HostSessionInput } from "../schemas";

const DEFAULTS: HostSessionInput = {
  title: "",
  city: "",
  date: "",
  time: "",
  format: "In person",
  details: "",
  registrationUrl: "",
  cost: "Free",
  price: "",
};

export function HostSessionDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const host = useHostSession();
  const form = useForm<HostSessionInput>({
    resolver: zodResolver(hostSessionSchema),
    defaultValues: DEFAULTS,
  });
  const errors = form.formState.errors;
  const cost = useWatch({ control: form.control, name: "cost" });

  async function onSubmit(values: HostSessionInput) {
    await host.mutateAsync({ ...values, hostId: user?.id ?? "", hostName: user?.name ?? "A member" });
    form.reset(DEFAULTS);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <Megaphone data-icon="inline-start" />
        Tell us about your session
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hosting a session?</DialogTitle>
          <DialogDescription>
            Share the details and the admins will publish it for the community, marked as hosted by you.
          </DialogDescription>
        </DialogHeader>

        <form id="host-session" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="h-title">Event name</FieldLabel>
              <Input id="h-title" aria-invalid={!!errors.title} {...form.register("title")} />
              <FieldError errors={[errors.title]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="h-city">Location (city)</FieldLabel>
                <Input id="h-city" placeholder="Bangalore, or Online" aria-invalid={!!errors.city} {...form.register("city")} />
                <FieldError errors={[errors.city]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="h-format">Format</FieldLabel>
                <NativeSelect id="h-format" className="w-full" {...form.register("format")}>
                  <NativeSelectOption value="In person">In person</NativeSelectOption>
                  <NativeSelectOption value="Online">Online</NativeSelectOption>
                  <NativeSelectOption value="Hybrid">Hybrid</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="h-date">Date</FieldLabel>
                <Input id="h-date" type="date" aria-invalid={!!errors.date} {...form.register("date")} />
                <FieldError errors={[errors.date]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="h-time">Time</FieldLabel>
                <Input id="h-time" type="time" aria-invalid={!!errors.time} {...form.register("time")} />
                <FieldError errors={[errors.time]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="h-details">Details of the event</FieldLabel>
              <Textarea id="h-details" rows={4} aria-invalid={!!errors.details} {...form.register("details")} />
              <FieldError errors={[errors.details]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="h-link">Link to register</FieldLabel>
              <Input id="h-link" placeholder="https://" aria-invalid={!!errors.registrationUrl} {...form.register("registrationUrl")} />
              <FieldError errors={[errors.registrationUrl]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="h-cost">Free or charged?</FieldLabel>
                <NativeSelect id="h-cost" className="w-full" {...form.register("cost")}>
                  <NativeSelectOption value="Free">Free</NativeSelectOption>
                  <NativeSelectOption value="Paid">Charged</NativeSelectOption>
                </NativeSelect>
              </Field>
              {cost === "Paid" && (
                <Field>
                  <FieldLabel htmlFor="h-price">Price</FieldLabel>
                  <Input id="h-price" placeholder="e.g. ₹500" aria-invalid={!!errors.price} {...form.register("price")} />
                  <FieldError errors={[errors.price]} />
                </Field>
              )}
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="submit" form="host-session" disabled={host.isPending}>
            Send to the admins
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
