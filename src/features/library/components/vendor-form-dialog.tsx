"use client";

/**
 * One vendor form, two uses (spec §7.4):
 *  - "suggest": any member recommends a vendor; it goes to admin review.
 *  - "edit":    an admin corrects a vendor's published details.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import type { Vendor } from "@/lib/sample-data";
import { useLibraryAdmin, useSuggestVendor, useUpdateVendor } from "../hooks/use-library";
import { vendorSchema, type VendorInput } from "../schemas";

const EMPTY: VendorInput = {
  name: "",
  category: "",
  description: "",
  city: "",
  area: "",
  phone: "",
  website: "",
  email: "",
  instagram: "",
};

export function VendorFormDialog({
  categories,
  vendor,
  direct = false,
}: {
  categories: string[];
  /** Present → admin edit mode. */
  vendor?: Vendor;
  /** Admin: publish straight to the directory instead of suggesting. */
  direct?: boolean;
}) {
  const { user } = useAuth();
  const isEdit = Boolean(vendor);
  const [open, setOpen] = useState(false);
  const suggest = useSuggestVendor();
  const update = useUpdateVendor();
  const { createVendor } = useLibraryAdmin();
  const form = useForm<VendorInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor
      ? {
          name: vendor.name,
          category: vendor.category,
          description: vendor.description,
          city: vendor.city,
          area: vendor.area,
          phone: vendor.phone,
          website: vendor.website,
          email: vendor.email,
          instagram: vendor.instagram,
        }
      : EMPTY,
  });
  const errors = form.formState.errors;
  const id = vendor?.id ?? "new";
  const pending = suggest.isPending || update.isPending || createVendor.isPending;

  async function onSubmit(values: VendorInput) {
    if (vendor) {
      await update.mutateAsync({ id: vendor.id, input: values });
    } else {
      if (direct) await createVendor.mutateAsync(values);
      else await suggest.mutateAsync({ input: values, submittedBy: user?.name ?? "A member" });
      form.reset(EMPTY);
    }
    setOpen(false);
  }

  const field = (name: keyof VendorInput, label: string, placeholder?: string) => (
    <Field>
      <FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
      <Input
        id={`${id}-${name}`}
        placeholder={placeholder}
        aria-invalid={!!errors[name]}
        {...form.register(name)}
      />
      <FieldError errors={[errors[name]]} />
    </Field>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button size="sm" variant="ghost" />}>
          <Pencil data-icon="inline-start" />
          Edit
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant={direct ? "outline" : "default"} />}>
          <Plus data-icon="inline-start" />
          {direct ? "Add vendor" : "Recommend a Vendor"}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${vendor?.name}` : direct ? "Add a vendor" : "Recommend a Vendor"}</DialogTitle>
          <DialogDescription>
            {isEdit || direct
              ? "Changes publish straight to the directory."
              : "Know a vendor you’d vouch for, fill in their details! The admins review every suggestion first."}
          </DialogDescription>
        </DialogHeader>

        <form id={`vendor-form-${id}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {field("name", "Name of vendor")}
            <Field>
              <FieldLabel htmlFor={`${id}-category`}>Category</FieldLabel>
              <NativeSelect id={`${id}-category`} className="w-full" aria-invalid={!!errors.category} {...form.register("category")}>
                <NativeSelectOption value="">Choose a category</NativeSelectOption>
                {categories.map((c) => (
                  <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.category]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-description`}>Description (if any)</FieldLabel>
              <Textarea id={`${id}-description`} rows={3} {...form.register("description")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("city", "City", "e.g. Bangalore or Pan-India")}
              {field("area", "Exact area (optional)", "e.g. Indiranagar")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("phone", "Phone / WhatsApp", "10-digit mobile")}
              {field("email", "Email", "hello@vendor.com")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("website", "Website", "vendor.com")}
              {field("instagram", "Instagram handle", "@vendor")}
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="submit" form={`vendor-form-${id}`} disabled={pending}>
            {isEdit ? "Save changes" : direct ? "Add to directory" : "Send for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
