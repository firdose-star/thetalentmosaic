"use client";

/**
 * Admin editor for a member's engagement: tick the events they attended and
 * set their tags (Speaker, Volunteer, … or a new custom tag). Tiers and
 * counts update everywhere once saved. Used on Health and on People profiles.
 */
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { shortDate } from "@/lib/community";
import { cn } from "@/lib/utils";
import { useHealthActions } from "../hooks/use-health";

export const DEFAULT_TAGS = ["Speaker", "Volunteer", "Community champion", "Resource contributor", "Vendor contributor"];

export function EngagementEditor({
  memberId,
  memberName,
  eventsAttended,
  tags: initialTags,
  events,
  knownTags = DEFAULT_TAGS,
  label = "Edit events & tags",
}: {
  memberId: string;
  memberName: string;
  eventsAttended: string[];
  tags: string[];
  events: { id: string; title: string; date: string; city: string }[];
  knownTags?: string[];
  label?: string;
}) {
  const { updateMember } = useHealthActions();
  const [open, setOpen] = useState(false);
  const [attended, setAttended] = useState(eventsAttended);
  const [tags, setTags] = useState(initialTags);
  const [custom, setCustom] = useState("");
  const allTags = [...new Set([...knownTags, ...tags])];
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setAttended(eventsAttended);
          setTags(initialTags);
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Pencil data-icon="inline-start" />
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{memberName}</DialogTitle>
          <DialogDescription>Tick the events they attended and tag how they’re engaged.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Events attended ({attended.length})</p>
          <ul className="flex max-h-56 flex-col overflow-y-auto rounded-lg border p-1">
            {events.map((e) => (
              <li key={e.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
                  <Checkbox checked={attended.includes(e.id)} onCheckedChange={() => setAttended((a) => toggle(a, e.id))} />
                  <span className="flex-1 text-sm">{e.title}</span>
                  <span className="text-xs text-muted-foreground">{shortDate(e.date, true)} · {e.city}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags((t) => toggle(t, tag))}
                  className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a custom tag" aria-label="Custom tag" />
            <Button
              variant="outline"
              onClick={() => {
                const value = custom.trim();
                if (value && !tags.includes(value)) setTags((t) => [...t, value]);
                setCustom("");
              }}
            >
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={updateMember.isPending}
            onClick={() => updateMember.mutate({ memberId, patch: { eventsAttended: attended, tags } }, { onSuccess: () => setOpen(false) })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
