"use client";

/**
 * Admin: edit everything about a member in one place — photo, profile,
 * contact details, community status, owner, events attended and tags.
 * Changes apply everywhere at once (People, Health, Overview) and each one
 * is written to the activity log as before → after.
 */
import { ImageUp, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { shortDate } from "@/lib/community";
import { cn } from "@/lib/utils";
import { HR_FUNCTIONS, MEMBER_STATUSES, SENIORITY_LEVELS, type Member } from "@/types/community";
import { useAdminActions, useAdminData } from "../hooks/use-admin";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

type Form = {
  name: string;
  designation: string;
  startup: string;
  city: string;
  seniority: Member["seniority"];
  hrFunction: Member["hrFunction"];
  years: string;
  linkedin: string;
  email: string;
  formEmail: string;
  whatsapp: string;
  birthMonth: string;
  birthDay: string;
  hobbies: string;
  status: Member["status"];
  directoryConsent: boolean;
  owner: string;
  photoUrl: string;
  eventsAttended: string[];
  tags: string[];
};

const toForm = (m: Member): Form => ({
  name: m.name,
  designation: m.designation,
  startup: m.startup,
  city: m.city,
  seniority: m.seniority,
  hrFunction: m.hrFunction,
  years: m.yearsOfExperience === null ? "" : String(m.yearsOfExperience),
  linkedin: m.linkedin,
  email: m.email,
  formEmail: m.formEmail ?? "",
  whatsapp: m.whatsapp,
  birthMonth: m.birthday ? String(m.birthday.month) : "",
  birthDay: m.birthday ? String(m.birthday.day) : "",
  hobbies: m.hobbies.join(", "),
  status: m.status,
  directoryConsent: m.directoryConsent !== false,
  owner: m.owner ?? "",
  photoUrl: m.photoUrl ?? "",
  eventsAttended: m.eventsAttended,
  tags: m.tags,
});

function toPatch(f: Form): Partial<Member> {
  const years = f.years.trim() === "" ? null : Number(f.years);
  const day = Number(f.birthDay);
  return {
    name: f.name.trim(),
    designation: f.designation.trim(),
    startup: f.startup.trim(),
    city: f.city.trim(),
    seniority: f.seniority,
    hrFunction: f.hrFunction,
    yearsOfExperience: years !== null && Number.isFinite(years) && years >= 0 ? years : null,
    linkedin: f.linkedin.trim().replace(/^https?:\/\/(www\.)?/, ""),
    email: f.email.trim().toLowerCase(),
    formEmail: f.formEmail.trim().toLowerCase() || undefined,
    whatsapp: f.whatsapp.replace(/\D/g, "").slice(-10),
    birthday: f.birthMonth !== "" && day >= 1 && day <= 31 ? { month: Number(f.birthMonth), day } : null,
    hobbies: f.hobbies.split(",").map((h) => h.trim()).filter(Boolean),
    status: f.status,
    directoryConsent: f.directoryConsent,
    owner: f.owner || null,
    photoUrl: f.photoUrl.trim() || null,
    eventsAttended: f.eventsAttended,
    tags: f.tags,
  };
}

export function EditMemberButton({ memberId, label = "Edit", size = "xs" }: { memberId: string; label?: string; size?: "xs" | "sm" }) {
  const { data } = useAdminData();
  const { editMember } = useAdminActions();
  const member = data?.members.find((m) => m.id === memberId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [eventQuery, setEventQuery] = useState("");

  if (!data || !member) return null;
  const f = form ?? toForm(member);
  const set = (patch: Partial<Form>) => setForm({ ...f, ...patch });
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoError("Choose an image file.");
    if (file.size > MAX_PHOTO_BYTES) return setPhotoError("Keep photos under 2 MB.");
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => set({ photoUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  const events = data.events.filter((e) => e.title.toLowerCase().includes(eventQuery.trim().toLowerCase()));
  const text = (key: keyof Form, labelText: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Field>
      <FieldLabel htmlFor={`me-${key}`}>{labelText}</FieldLabel>
      <Input id={`me-${key}`} value={String(f[key] ?? "")} onChange={(e) => set({ [key]: e.target.value } as Partial<Form>)} {...props} />
    </Field>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setForm(toForm(member));
      }}
    >
      <DialogTrigger render={<Button size={size} variant="outline" />}>
        <Pencil data-icon="inline-start" />
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {member.name}</DialogTitle>
          <DialogDescription>Every change applies across the dashboard and is recorded in the activity log.</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          {/* Photo */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border p-3">
            <MemberAvatar name={member.name} src={f.photoUrl || null} className="size-16" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Input value={f.photoUrl.startsWith("data:") ? "Uploaded photo" : f.photoUrl} onChange={(e) => set({ photoUrl: e.target.value })} placeholder="Paste a photo link, or upload one" aria-label="Photo link" disabled={f.photoUrl.startsWith("data:")} />
              <div className="flex flex-wrap gap-2">
                <input id={`photo-${member.id}`} type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                <label htmlFor={`photo-${member.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
                  <ImageUp data-icon="inline-start" />
                  Upload photo
                </label>
                {f.photoUrl && (
                  <Button size="sm" variant="ghost" onClick={() => set({ photoUrl: "" })}>
                    <Trash2 data-icon="inline-start" />
                    Remove
                  </Button>
                )}
              </div>
              {photoError && <p className="text-xs text-destructive">{photoError}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {text("name", "Full name")}
            {text("designation", "Current role")}
            {text("startup", "Company / startup")}
            {text("city", "City")}
            <Field>
              <FieldLabel htmlFor="me-seniority">Seniority</FieldLabel>
              <NativeSelect id="me-seniority" className="w-full" value={f.seniority} onChange={(e) => set({ seniority: e.target.value as Form["seniority"] })}>
                {SENIORITY_LEVELS.map((s) => <NativeSelectOption key={s} value={s}>{s}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="me-function">HR function</FieldLabel>
              <NativeSelect id="me-function" className="w-full" value={f.hrFunction ?? ""} onChange={(e) => set({ hrFunction: (e.target.value || null) as Form["hrFunction"] })}>
                <NativeSelectOption value="">Not shared</NativeSelectOption>
                {HR_FUNCTIONS.map((s) => <NativeSelectOption key={s} value={s}>{s}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            {text("years", "Years in HR", { type: "number", min: 0, step: 0.5, placeholder: "Not shared" })}
            {text("linkedin", "LinkedIn", { placeholder: "linkedin.com/in/…" })}
            {text("email", "Email ID", { type: "email" })}
            {text("formEmail", "Email address (form)", { type: "email" })}
            {text("whatsapp", "WhatsApp", { placeholder: "10-digit mobile" })}
            <Field>
              <FieldLabel>Birthday</FieldLabel>
              <div className="flex gap-2">
                <NativeSelect aria-label="Birth month" className="w-full" value={f.birthMonth} onChange={(e) => set({ birthMonth: e.target.value })}>
                  <NativeSelectOption value="">Month</NativeSelectOption>
                  {MONTHS.map((m, i) => <NativeSelectOption key={m} value={i}>{m}</NativeSelectOption>)}
                </NativeSelect>
                <Input aria-label="Birth day" type="number" min={1} max={31} placeholder="Day" value={f.birthDay} onChange={(e) => set({ birthDay: e.target.value })} className="w-24" />
              </div>
            </Field>
          </div>

          {text("hobbies", "Hobbies (comma separated)")}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="me-status">Status</FieldLabel>
              <NativeSelect id="me-status" className="w-full" value={f.status} onChange={(e) => set({ status: e.target.value as Form["status"] })}>
                {MEMBER_STATUSES.map((s) => <NativeSelectOption key={s} value={s}>{s}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="me-owner">Relationship owner</FieldLabel>
              <NativeSelect id="me-owner" className="w-full" value={f.owner} onChange={(e) => set({ owner: e.target.value })}>
                <NativeSelectOption value="">Unassigned</NativeSelectOption>
                {data.owners.map((o) => <NativeSelectOption key={o} value={o}>{o}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={f.directoryConsent} onCheckedChange={(v) => set({ directoryConsent: Boolean(v) })} />
            Show in the member directory
          </label>

          <Field>
            <FieldLabel>Events attended ({f.eventsAttended.length})</FieldLabel>
            <Input value={eventQuery} onChange={(e) => setEventQuery(e.target.value)} placeholder="Find an event" aria-label="Find an event" className="h-8" />
            <ul className="flex max-h-48 flex-col overflow-y-auto rounded-lg border p-1">
              {events.length === 0 && <li className="p-2 text-sm text-muted-foreground">No events yet — add them on the Events page.</li>}
              {events.map((e) => (
                <li key={e.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
                    <Checkbox checked={f.eventsAttended.includes(e.id)} onCheckedChange={() => set({ eventsAttended: toggle(f.eventsAttended, e.id) })} />
                    <span className="flex-1 text-sm">{e.title}</span>
                    <span className="text-xs text-muted-foreground">{shortDate(e.date, true)} · {e.city}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Field>

          <Field>
            <FieldLabel>Tags</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...data.tags, ...f.tags])].map((tag) => {
                const on = f.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ tags: toggle(f.tags, tag) })}
                    className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag" aria-label="New tag" className="h-8" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const t = newTag.trim();
                  if (t && !f.tags.includes(t)) set({ tags: [...f.tags, t] });
                  setNewTag("");
                }}
              >
                Add tag
              </Button>
            </div>
            <FieldDescription>Tags help the team group members, e.g. Speaker or Volunteer.</FieldDescription>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            disabled={editMember.isPending || !f.name.trim()}
            onClick={() => editMember.mutate({ id: member.id, patch: toPatch(f) }, { onSuccess: () => setOpen(false) })}
          >
            Save member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
