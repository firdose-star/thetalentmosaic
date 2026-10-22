"use client";

/**
 * Admin-only: add, rename and remove vendor categories (spec §7.4). Render
 * inside `<RoleGuard allow={["admin"]}>`.
 */
import { Check, Pencil, Settings2, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCategoryMutations } from "../hooks/use-library";
import { categorySchema } from "../schemas";

export function CategoryManagerDialog({ categories }: { categories: string[] }) {
  const { add, rename, remove } = useCategoryMutations();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ from: string; to: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submitNew() {
    const parsed = categorySchema.safeParse(draft);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid name");
    setError(null);
    add.mutate(parsed.data, { onSuccess: () => setDraft("") });
  }

  function submitRename() {
    if (!editing) return;
    const parsed = categorySchema.safeParse(editing.to);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid name");
    setError(null);
    rename.mutate({ from: editing.from, to: parsed.data }, { onSuccess: () => setEditing(null) });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Settings2 data-icon="inline-start" />
        Manage categories
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vendor categories</DialogTitle>
          <DialogDescription>Add, rename or remove the categories members can pick from.</DialogDescription>
        </DialogHeader>

        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {categories.map((category) => (
            <li key={category} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
              {editing?.from === category ? (
                <>
                  <Input
                    autoFocus
                    value={editing.to}
                    onChange={(e) => setEditing({ from: category, to: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && submitRename()}
                    className="h-8"
                    aria-label={`Rename ${category}`}
                  />
                  <Button size="icon-sm" variant="ghost" onClick={submitRename} aria-label="Save">
                    <Check />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setEditing(null)} aria-label="Cancel">
                    <X />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{category}</span>
                  <Button size="icon-sm" variant="ghost" onClick={() => setEditing({ from: category, to: category })} aria-label={`Rename ${category}`}>
                    <Pencil />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => remove.mutate(category)} aria-label={`Remove ${category}`}>
                    <Trash2 />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNew()}
            placeholder="New category"
            aria-label="New category"
          />
          <Button onClick={submitNew} disabled={add.isPending}>Add</Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
