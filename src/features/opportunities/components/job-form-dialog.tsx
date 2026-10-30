"use client";

/**
 * Admin: the role form — "Add a role" (the team's own listing), "Edit" in
 * Listing management, and the review step after "Add from URL". Render
 * inside a RoleGuard. Pass `open` / `onOpenChange` to control it from outside
 * (no trigger is rendered then).
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  INDUSTRIES,
  INDUSTRY_LABELS,
  REMOTE_MODES,
  REMOTE_MODE_LABELS,
  ROLE_FAMILIES,
  ROLE_FAMILY_LABELS,
  ROLE_SENIORITIES,
  ROLE_SENIORITY_LABELS,
  ROLE_STATUSES,
  type RoleListing,
} from "@/types/roles";

import { useRoleAdmin } from "../hooks/use-opportunities";
import { roleInputSchema, type RoleInput } from "../schemas";

const STATUS_LABELS = { unverified: "Unverified — not shown", approved: "Approved — members see it", hidden: "Hidden", expired: "Expired" };

const EMPTY: RoleInput = {
  title: "",
  company: "",
  companyUrl: "",
  roleFamily: "talent_acquisition",
  seniority: "unknown",
  employmentType: "full_time",
  industry: "other",
  minYears: "",
  maxYears: "",
  city: "",
  country: "India",
  remoteMode: "onsite",
  salaryText: "",
  description: "",
  howToApply: "",
  applyUrl: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactWhatsapp: "",
  contactPhone: "",
  contactLinkedin: "",
  contactOther: "",
  // The team adding a role is the check.
  status: "approved",
};

const fromRole = (r: RoleListing): RoleInput => ({
  title: r.title,
  company: r.company.name,
  companyUrl: r.company.url ?? "",
  roleFamily: r.roleFamily,
  seniority: r.seniority,
  employmentType: r.employmentType,
  industry: r.industry ?? "other",
  minYears: r.experience?.minYears === undefined ? "" : String(r.experience.minYears),
  maxYears: r.experience?.maxYears === undefined ? "" : String(r.experience.maxYears),
  city: r.location.city ?? "",
  country: r.location.country ?? "",
  remoteMode: r.location.remoteMode,
  salaryText: r.salary.text ?? "",
  description: r.description,
  howToApply: r.howToApply ?? "",
  applyUrl: r.sources[0]?.url ?? "",
  contactName: r.contact?.name ?? "",
  contactRole: r.contact?.roleAtCompany ?? "",
  contactEmail: r.contact?.email ?? "",
  contactWhatsapp: r.contact?.whatsapp ?? "",
  contactPhone: r.contact?.phone ?? "",
  contactLinkedin: r.contact?.linkedinUrl ?? "",
  contactOther: r.contact?.other ?? "",
  status: r.status,
});

const options = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map((v) => ({ value: v, label: labels[v] }));

export function RoleFormDialog({
  role,
  open: controlledOpen,
  onOpenChange,
  title,
}: {
  role?: RoleListing;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}) {
  const [ownOpen, setOwnOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : ownOpen;
  const { create, update } = useRoleAdmin();
  const defaults = role ? fromRole(role) : EMPTY;
  const form = useForm<RoleInput>({ resolver: zodResolver(roleInputSchema), defaultValues: defaults, values: controlled ? defaults : undefined });
  const errors = form.formState.errors;
  const id = role?.id ?? "new";

  function setOpen(next: boolean) {
    if (!controlled) setOwnOpen(next);
    onOpenChange?.(next);
    if (next) form.reset(defaults);
  }

  async function onSubmit(values: RoleInput) {
    if (role) await update.mutateAsync({ id: role.id, patch: values });
    else await create.mutateAsync(values);
    form.reset(EMPTY);
    setOpen(false);
  }

  const text = (key: keyof RoleInput, label: string, placeholder?: string, type = "text") => (
    <Field>
      <FieldLabel htmlFor={`role-${id}-${key}`}>{label}</FieldLabel>
      <Input id={`role-${id}-${key}`} type={type} placeholder={placeholder} aria-invalid={!!errors[key]} {...form.register(key)} />
      <FieldError errors={[errors[key]]} />
    </Field>
  );
  const select = (key: "roleFamily" | "seniority" | "employmentType" | "industry" | "remoteMode" | "status", label: string, opts: { value: string; label: string }[]) => (
    <Field>
      <FieldLabel htmlFor={`role-${id}-${key}`}>{label}</FieldLabel>
      <NativeSelect id={`role-${id}-${key}`} className="w-full" {...form.register(key)}>
        {opts.map((o) => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
      </NativeSelect>
    </Field>
  );
  const warnings = role?.extraction?.warnings ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlled &&
        (role ? (
          <DialogTrigger render={<Button size="xs" variant="ghost" />}>
            <Pencil data-icon="inline-start" />
            Edit
          </DialogTrigger>
        ) : (
          <DialogTrigger render={<Button variant="outline" />}>
            <Plus data-icon="inline-start" />
            Add a role
          </DialogTrigger>
        ))}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title ?? (role ? `Edit ${role.title}` : "Add a role")}</DialogTitle>
          <DialogDescription>
            Members only see a role once it is Approved. Contact details are shown to signed-in members only.
          </DialogDescription>
        </DialogHeader>
        {warnings.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-lg bg-chart-3/10 px-3 py-2 text-sm">
            {warnings.map((w) => <li key={w}>⚠ {w}</li>)}
          </ul>
        )}
        <form id={`role-form-${id}`} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {text("title", "Job title")}
            <div className="grid gap-4 sm:grid-cols-2">
              {text("company", "Company")}
              {text("companyUrl", "Company website (optional)", "https://")}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {select("roleFamily", "Role", options(ROLE_FAMILIES, ROLE_FAMILY_LABELS))}
              {select("seniority", "Seniority", options(ROLE_SENIORITIES, ROLE_SENIORITY_LABELS))}
              {select("employmentType", "Employment type", options(EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {select("industry", "Company type", options(INDUSTRIES, INDUSTRY_LABELS))}
              {text("minYears", "Experience: from (years)", "Blank if not stated")}
              {text("maxYears", "to (years, optional)", "e.g. 5")}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {text("city", "City", "Bengaluru")}
              {text("country", "Country", "India")}
              {select("remoteMode", "Work mode", options(REMOTE_MODES, REMOTE_MODE_LABELS))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("applyUrl", "Apply link (the original source)", "https://")}
              {text("salaryText", "Salary (optional)", "₹20–25 LPA")}
            </div>
            <Field>
              <FieldLabel htmlFor={`role-${id}-description`}>About the startup (1–2 lines)</FieldLabel>
              <Textarea id={`role-${id}-description`} rows={2} placeholder="What the company does, in a sentence or two. The full job description stays at the apply link." {...form.register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`role-${id}-howToApply`}>How to apply (optional)</FieldLabel>
              <Textarea id={`role-${id}-howToApply`} rows={2} placeholder={'"Email your CV with the subject HRBP – Bengaluru"'} {...form.register("howToApply")} />
            </Field>
            <FieldSet>
              <FieldLegend variant="label">Contact</FieldLegend>
              <FieldDescription>Who applicants are told to reach. Hidden from anyone not signed in.</FieldDescription>
              <div className="grid gap-4 sm:grid-cols-2">
                {text("contactName", "Name")}
                {text("contactRole", "Their role", "Founder, HR Head…")}
                {text("contactEmail", "Email", undefined, "email")}
                {text("contactWhatsapp", "WhatsApp", "+91…")}
                {text("contactPhone", "Phone", "+91…")}
                {text("contactLinkedin", "LinkedIn profile", "https://www.linkedin.com/in/…")}
              </div>
              {text("contactOther", "Other", "DM the poster")}
            </FieldSet>
            {select("status", "Status", ROLE_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })))}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form={`role-form-${id}`} disabled={create.isPending || update.isPending}>Save role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRoleButton({ role }: { role: RoleListing }) {
  const { remove } = useRoleAdmin();
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <Button size="xs" variant="destructive" onClick={() => remove.mutate(role)} onBlur={() => setConfirming(false)}>Delete?</Button>
  ) : (
    <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setConfirming(true)} aria-label={`Delete ${role.title}`}>
      <Trash2 />
    </Button>
  );
}
