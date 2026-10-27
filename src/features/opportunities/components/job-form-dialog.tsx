"use client";

/**
 * Admin: add a job listing by hand, or edit or remove one — until the
 * job-scraping feed is connected. Render inside a RoleGuard.
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
import { HR_FUNCTIONS, SENIORITY_LEVELS, type JobListing } from "@/types/community";
import { useJobAdmin } from "../hooks/use-opportunities";
import { jobSchema, type JobInput } from "../schemas";

const EMPTY: JobInput = {
  title: "",
  company: "",
  location: "",
  hrFunction: "Talent Acquisition",
  seniority: "Manager",
  arrangement: "Hybrid",
  type: "Full-time",
  url: "",
  source: "",
  salary: "",
  experience: "",
  description: "",
  skills: "",
  status: "active",
};

const fromJob = (j: JobListing): JobInput => ({
  title: j.title,
  company: j.company,
  location: j.location,
  hrFunction: j.hrFunction,
  seniority: j.seniority,
  arrangement: j.arrangement,
  type: j.type,
  url: j.url,
  source: j.source,
  salary: j.salary,
  experience: j.experience,
  description: j.description,
  skills: j.skills.join(", "),
  status: j.status,
});

export function JobFormDialog({ job }: { job?: JobListing }) {
  const [open, setOpen] = useState(false);
  const { create, update } = useJobAdmin();
  const form = useForm<JobInput>({ resolver: zodResolver(jobSchema), defaultValues: job ? fromJob(job) : EMPTY });
  const errors = form.formState.errors;
  const id = job?.id ?? "new";

  async function onSubmit(values: JobInput) {
    if (job) await update.mutateAsync({ id: job.id, input: values });
    else await create.mutateAsync(values);
    form.reset(EMPTY);
    setOpen(false);
  }

  const text = (key: keyof JobInput, label: string, placeholder?: string) => (
    <Field>
      <FieldLabel htmlFor={`job-${id}-${key}`}>{label}</FieldLabel>
      <Input id={`job-${id}-${key}`} placeholder={placeholder} aria-invalid={!!errors[key]} {...form.register(key)} />
      <FieldError errors={[errors[key]]} />
    </Field>
  );
  const select = (key: "hrFunction" | "seniority" | "arrangement" | "type" | "status", label: string, options: readonly string[]) => (
    <Field>
      <FieldLabel htmlFor={`job-${id}-${key}`}>{label}</FieldLabel>
      <NativeSelect id={`job-${id}-${key}`} className="w-full" {...form.register(key)}>
        {options.map((o) => <NativeSelectOption key={o} value={o}>{o}</NativeSelectOption>)}
      </NativeSelect>
    </Field>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) form.reset(job ? fromJob(job) : EMPTY); }}>
      {job ? (
        <DialogTrigger render={<Button size="xs" variant="ghost" />}>
          <Pencil data-icon="inline-start" />
          Edit
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="outline" />}>
          <Plus data-icon="inline-start" />
          Add a role
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{job ? `Edit ${job.title}` : "Add a role"}</DialogTitle>
          <DialogDescription>Shows on the job board straight away while it is Active.</DialogDescription>
        </DialogHeader>
        <form id={`job-form-${id}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {text("title", "Job title")}
            <div className="grid gap-4 sm:grid-cols-2">
              {text("company", "Company")}
              {text("location", "Location", "Bangalore, or Remote")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {select("hrFunction", "Role (HR function)", HR_FUNCTIONS)}
              {select("seniority", "Seniority", SENIORITY_LEVELS)}
              {select("arrangement", "Work arrangement", ["Hybrid", "On-site", "Remote"])}
              {select("type", "Employment type", ["Full-time", "Contract", "Internship"])}
            </div>
            {text("url", "Original application link", "https://")}
            <div className="grid gap-4 sm:grid-cols-2">
              {text("source", "Source", "LinkedIn, careers page…")}
              {text("salary", "Salary (optional)", "₹20–25 LPA")}
            </div>
            {text("experience", "Experience asked for", "5+ years in HRBP roles")}
            <Field>
              <FieldLabel htmlFor={`job-${id}-description`}>Description</FieldLabel>
              <Textarea id={`job-${id}-description`} rows={3} {...form.register("description")} />
            </Field>
            {text("skills", "Skills (comma separated)")}
            {select("status", "Status", ["active", "review", "expired"])}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form={`job-form-${id}`} disabled={create.isPending || update.isPending}>Save role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteJobButton({ job }: { job: JobListing }) {
  const { remove } = useJobAdmin();
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <Button size="xs" variant="destructive" onClick={() => remove.mutate(job.id)}>Remove?</Button>
  ) : (
    <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setConfirming(true)} aria-label={`Delete ${job.title}`}>
      <Trash2 />
    </Button>
  );
}
