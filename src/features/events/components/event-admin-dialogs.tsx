"use client";

/**
 * Admin-only event tagging:
 *  - WinnersDialog: tag one or more prize winners on a past catchup.
 *  - CoHostsDialog: mark an event as co-hosted by community members.
 * Render inside `<RoleGuard allow={["admin"]}>`.
 */
import { Plus, Trash2, Trophy, UsersRound } from "lucide-react";
import { useState } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
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
import { useEventAdminActions, useEventMemberOptions } from "../hooks/use-events";
import { winnerSchema, type WinnerInput } from "../schemas";
import type { EventView } from "../services/events.service";

export function WinnersDialog({ event }: { event: EventView }) {
  const { winners } = useEventAdminActions();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<WinnerInput[]>(event.winners?.length ? event.winners : [{ prize: "", winner: "" }]);
  const [error, setError] = useState<string | null>(null);

  function save() {
    const filled = rows.filter((r) => r.prize.trim() || r.winner.trim());
    const invalid = filled.find((r) => !winnerSchema.safeParse(r).success);
    if (invalid) return setError("Each winner needs both a prize and a name.");
    setError(null);
    winners.mutate({ eventId: event.id, winners: filled }, { onSuccess: () => setOpen(false) });
  }

  const update = (i: number, patch: Partial<WinnerInput>) =>
    setRows((current) => current.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Trophy data-icon="inline-start" />
        Tag winners
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Winners of the Catchup</DialogTitle>
          <DialogDescription>{event.title} — add as many winners as there were prizes.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input value={row.prize} onChange={(e) => update(i, { prize: e.target.value })} placeholder="Prize, e.g. Quiz night" aria-label={`Prize ${i + 1}`} />
              <Input value={row.winner} onChange={(e) => update(i, { winner: e.target.value })} placeholder="Member or team" aria-label={`Winner ${i + 1}`} />
              <Button size="icon" variant="ghost" aria-label="Remove winner" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => setRows((r) => [...r, { prize: "", winner: "" }])}>
            <Plus data-icon="inline-start" />
            Add another winner
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={winners.isPending}>Save winners</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CoHostsDialog({ event }: { event: EventView }) {
  const { coHosts } = useEventAdminActions();
  const options = useEventMemberOptions();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(event.coHosts.map((c) => c.id));
  const [query, setQuery] = useState("");

  const visible = (options.data ?? []).filter((m) =>
    m.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <UsersRound data-icon="inline-start" />
        Co-hosts
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Co-hosted by a Community Member?</DialogTitle>
          <DialogDescription>Tag the members who co-hosted {event.title}. Everyone will see them on the event.</DialogDescription>
        </DialogHeader>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" aria-label="Search members" />
        <ul className="flex max-h-72 flex-col overflow-y-auto">
          {visible.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted">
                <Checkbox checked={selected.includes(m.id)} onCheckedChange={() => toggle(m.id)} />
                <MemberAvatar name={m.name} className="size-7" />
                <span className="text-sm">{m.name}</span>
              </label>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <span className="mr-auto self-center text-xs text-muted-foreground">{selected.length} selected</span>
          <Button
            onClick={() => coHosts.mutate({ eventId: event.id, memberIds: selected }, { onSuccess: () => setOpen(false) })}
            disabled={coHosts.isPending}
          >
            Save co-hosts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
