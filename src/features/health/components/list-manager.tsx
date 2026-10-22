"use client";

/**
 * Add, rename and remove items in an admin-managed list (relationship
 * owners, interaction types). Removing an item still in use asks where its
 * records should go (PRD §9), instead of silently orphaning them.
 */
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function ListManager({
  items,
  usage,
  noun,
  allowUnassign = false,
  onAdd,
  onRename,
  onRemove,
}: {
  items: string[];
  /** How many records use each item. */
  usage: (item: string) => number;
  noun: string;
  /** Owners can be removed to "Unassigned"; types must remap to another type. */
  allowUnassign?: boolean;
  onAdd: (name: string) => void;
  onRename: (from: string, to: string) => void;
  onRemove: (name: string, remapTo: string | null) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ from: string; to: string } | null>(null);
  const [removing, setRemoving] = useState<{ name: string; to: string } | null>(null);

  function add() {
    const name = draft.trim();
    if (name.length < 2 || items.includes(name)) return;
    onAdd(name);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const used = usage(item);
          if (editing?.from === item) {
            return (
              <li key={item} className="flex items-center gap-2 rounded-lg px-2 py-1">
                <Input autoFocus value={editing.to} onChange={(e) => setEditing({ from: item, to: e.target.value })} className="h-8" aria-label={`Rename ${item}`} />
                <Button size="icon-sm" variant="ghost" aria-label="Save" onClick={() => {
                  const to = editing.to.trim();
                  if (to.length >= 2 && !items.includes(to)) onRename(item, to);
                  setEditing(null);
                }}>
                  <Check />
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Cancel" onClick={() => setEditing(null)}><X /></Button>
              </li>
            );
          }
          if (removing?.name === item) {
            const others = items.filter((i) => i !== item);
            return (
              <li key={item} className="flex flex-wrap items-center gap-2 rounded-lg bg-destructive/5 px-2 py-2 text-sm">
                <span className="flex-1">
                  Remove <b>{item}</b>? {used} {used === 1 ? "record uses" : "records use"} it — move them to
                </span>
                <NativeSelect size="sm" aria-label="Move records to" value={removing.to} onChange={(e) => setRemoving({ name: item, to: e.target.value })}>
                  {allowUnassign && <NativeSelectOption value="">Unassigned</NativeSelectOption>}
                  {others.map((o) => <NativeSelectOption key={o} value={o}>{o}</NativeSelectOption>)}
                </NativeSelect>
                <Button size="sm" variant="destructive" onClick={() => {
                  onRemove(item, removing.to || null);
                  setRemoving(null);
                }}>
                  Remove
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
              </li>
            );
          }
          return (
            <li key={item} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
              <span className="flex-1 text-sm">{item}</span>
              <Badge variant="outline" className="tabular-nums">{used} {noun}</Badge>
              <Button size="icon-sm" variant="ghost" aria-label={`Rename ${item}`} onClick={() => setEditing({ from: item, to: item })}><Pencil /></Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Remove ${item}`}
                disabled={!allowUnassign && items.length === 1}
                onClick={() => {
                  const fallback = allowUnassign ? "" : (items.find((i) => i !== item) ?? "");
                  if (used === 0) onRemove(item, fallback || null);
                  else setRemoving({ name: item, to: fallback });
                }}
              >
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={`Add a new ${noun === "members" ? "owner" : "type"}`} aria-label="New item" />
        <Button variant="outline" onClick={add}><Plus data-icon="inline-start" />Add</Button>
      </div>
    </div>
  );
}
