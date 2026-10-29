"use client";

/**
 * Admin: "Add from URL" — paste a job link or a founder's LinkedIn post. The
 * server reads it (or the pasted text, when the page needs a login), Claude
 * extracts the role, and the edit form opens pre-filled for review. The role
 * is saved Unverified until it is approved there.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/http-error";
import type { RoleListing } from "@/types/roles";

import { useRoleAdmin } from "../hooks/use-opportunities";
import { ingestUrlSchema, type IngestUrlInput } from "../schemas";
import { RoleFormDialog } from "./job-form-dialog";

export function AddFromUrlDialog() {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState<RoleListing | null>(null);
  const [needsText, setNeedsText] = useState(false);
  const { fromUrl } = useRoleAdmin();
  const form = useForm<IngestUrlInput>({ resolver: zodResolver(ingestUrlSchema), defaultValues: { url: "", pastedText: "" } });
  const errors = form.formState.errors;

  async function onSubmit(values: IngestUrlInput) {
    try {
      const role = await fromUrl.mutateAsync({ url: values.url, pastedText: values.pastedText || undefined });
      setOpen(false);
      setNeedsText(false);
      form.reset();
      setReview(role);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) setNeedsText(true);
      form.setError("root", { message: error instanceof Error ? error.message : "Couldn't add the role" });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { form.reset(); setNeedsText(false); } }}>
        <DialogTrigger render={<Button variant="outline" />}>
          <Link2 data-icon="inline-start" />
          Add from URL
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a role from a link</DialogTitle>
            <DialogDescription>
              A careers page, a job board, or a founder&apos;s LinkedIn post. We read it, pull out the details and any contact info, and you review before it goes live.
            </DialogDescription>
          </DialogHeader>
          <form id="role-from-url" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="role-url">Link</FieldLabel>
                <Input id="role-url" type="url" placeholder="https://www.linkedin.com/posts/…" aria-invalid={!!errors.url} {...form.register("url")} />
                <FieldError errors={[errors.url]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="role-text">Paste the post text {needsText ? "" : "(optional)"}</FieldLabel>
                <Textarea id="role-text" rows={needsText ? 8 : 4} aria-invalid={needsText} {...form.register("pastedText")} />
                <FieldDescription>
                  LinkedIn usually asks for a login, so we can&apos;t read the post ourselves — copy the post and paste it here. The link is still where members go to apply.
                </FieldDescription>
              </Field>
              {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="submit" form="role-from-url" disabled={fromUrl.isPending}>
              {fromUrl.isPending ? "Reading…" : "Read and review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {review && (
        <RoleFormDialog
          role={review}
          title="Review the role"
          open
          onOpenChange={(next) => { if (!next) setReview(null); }}
        />
      )}
    </>
  );
}
