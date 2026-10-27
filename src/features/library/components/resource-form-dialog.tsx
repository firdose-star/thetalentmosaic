"use client";

/**
 * Admin: add a resource, or edit or remove one. Render inside a RoleGuard.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { RESOURCE_CATEGORIES, type Resource } from "@/lib/sample-data";
import { useLibraryAdmin } from "../hooks/use-library";
import { resourceSchema, type ResourceInput } from "../schemas";

const EMPTY: ResourceInput = { title: "", category: "", description: "", source: "", link: "", access: "All members" };

const fromResource = (r: Resource): ResourceInput => ({
  title: r.title,
  category: r.category,
  description: r.description,
  source: r.source,
  link: r.link ?? "",
  access: r.access,
});

export function ResourceFormDialog({ resource }: { resource?: Resource }) {
  const [open, setOpen] = useState(false);
  const { saveResource } = useLibraryAdmin();
  const form = useForm<ResourceInput>({ resolver: zodResolver(resourceSchema), defaultValues: resource ? fromResource(resource) : EMPTY });
  const errors = form.formState.errors;
  const id = resource?.id ?? "new";

  async function onSubmit(values: ResourceInput) {
    await saveResource.mutateAsync({ id: resource?.id, input: values });
    form.reset(EMPTY);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) form.reset(resource ? fromResource(resource) : EMPTY); }}>
      {resource ? (
        <DialogTrigger render={<Button size="xs" variant="ghost" />}>
          <Pencil data-icon="inline-start" />
          Edit
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="outline" />}>
          <Plus data-icon="inline-start" />
          Add resource
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{resource ? `Edit ${resource.title}` : "Add a resource"}</DialogTitle>
          <DialogDescription>Publishes straight to Resources.</DialogDescription>
        </DialogHeader>
        <form id={`resource-${id}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`rs-${id}-title`}>Title</FieldLabel>
              <Input id={`rs-${id}-title`} aria-invalid={!!errors.title} {...form.register("title")} />
              <FieldError errors={[errors.title]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`rs-${id}-category`}>Category</FieldLabel>
                <NativeSelect id={`rs-${id}-category`} className="w-full" aria-invalid={!!errors.category} {...form.register("category")}>
                  <NativeSelectOption value="">Choose a category</NativeSelectOption>
                  {RESOURCE_CATEGORIES.map((c) => <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>)}
                </NativeSelect>
                <FieldError errors={[errors.category]} />
              </Field>
              <Field>
                <FieldLabel htmlFor={`rs-${id}-access`}>Who can see it</FieldLabel>
                <NativeSelect id={`rs-${id}-access`} className="w-full" {...form.register("access")}>
                  <NativeSelectOption value="All members">All members</NativeSelectOption>
                  <NativeSelectOption value="Verified members">Verified members</NativeSelectOption>
                  <NativeSelectOption value="Admins">Admins</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor={`rs-${id}-description`}>Description</FieldLabel>
              <Textarea id={`rs-${id}-description`} rows={3} aria-invalid={!!errors.description} {...form.register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`rs-${id}-source`}>Source</FieldLabel>
                <Input id={`rs-${id}-source`} placeholder="Contributed by …" {...form.register("source")} />
              </Field>
              <Field>
                <FieldLabel htmlFor={`rs-${id}-link`}>Link</FieldLabel>
                <Input id={`rs-${id}-link`} placeholder="https://" aria-invalid={!!errors.link} {...form.register("link")} />
                <FieldError errors={[errors.link]} />
              </Field>
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form={`resource-${id}`} disabled={saveResource.isPending}>Save resource</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteResourceButton({ resource }: { resource: Resource }) {
  const { deleteResource } = useLibraryAdmin();
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <Button size="xs" variant="destructive" onClick={() => deleteResource.mutate(resource.id)}>Remove?</Button>
  ) : (
    <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setConfirming(true)} aria-label={`Delete ${resource.title}`}>
      <Trash2 />
    </Button>
  );
}
