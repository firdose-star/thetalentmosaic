"use client";

/**
 * "Recommend a Vendor" (spec §7.4). Submissions enter the admin review queue;
 * only approved vendors appear in the directory.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { useSuggestVendor } from "../hooks/use-library";
import { vendorSuggestionSchema, type VendorSuggestionInput } from "../schemas";

export function VendorSuggestionDialog({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const suggest = useSuggestVendor();
  const form = useForm<VendorSuggestionInput>({
    resolver: zodResolver(vendorSuggestionSchema),
    defaultValues: { name: "", category: "", description: "", coverage: "", website: "", contact: "" },
  });
  const errors = form.formState.errors;

  async function onSubmit(values: VendorSuggestionInput) {
    await suggest.mutateAsync(values);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Recommend a Vendor
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recommend a Vendor</DialogTitle>
          <DialogDescription>
            Know a vendor you’d vouch for, fill in their details! The admins review every suggestion first.
          </DialogDescription>
        </DialogHeader>

        <form id="vendor-suggestion" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="v-name">Vendor name</FieldLabel>
              <Input id="v-name" aria-invalid={!!errors.name} {...form.register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="v-category">Category</FieldLabel>
              <NativeSelect id="v-category" className="w-full" aria-invalid={!!errors.category} {...form.register("category")}>
                <NativeSelectOption value="">Choose a category</NativeSelectOption>
                {categories.map((c) => (
                  <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.category]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="v-description">What do they do?</FieldLabel>
              <Textarea id="v-description" rows={3} aria-invalid={!!errors.description} {...form.register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="v-coverage">Location or service coverage</FieldLabel>
              <Input id="v-coverage" placeholder="e.g. Bangalore, Mumbai or Pan-India" aria-invalid={!!errors.coverage} {...form.register("coverage")} />
              <FieldError errors={[errors.coverage]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="v-website">Website (optional)</FieldLabel>
                <Input id="v-website" placeholder="vendor.com" {...form.register("website")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="v-contact">Phone or email (optional)</FieldLabel>
                <Input id="v-contact" {...form.register("contact")} />
              </Field>
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="submit" form="vendor-suggestion" disabled={suggest.isPending}>
            Send for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
