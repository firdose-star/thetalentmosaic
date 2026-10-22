"use client";

/**
 * Small pieces shared by the admin pages.
 */
import { X } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** "Reject with a reason" (PRD §7) — the reason goes into the activity log. */
export function DeclineDialog({
  label = "Reject",
  title,
  onConfirm,
}: {
  label?: string;
  title: string;
  onConfirm: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <X data-icon="inline-start" />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Add a reason. It is recorded in the activity log.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Couldn't verify the startup" aria-label="Reason" />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(reason.trim());
              setReason("");
              setOpen(false);
            }}
          >
            {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A clickable count that leads to the queue behind it. */
export function QueueCard({
  href,
  label,
  value,
  hint,
  icon,
  tone = "bg-accent text-primary",
  urgent = false,
}: {
  href: string;
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
  tone?: string;
  urgent?: boolean;
}) {
  return (
    <Link href={href} className="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <Card className={cn("h-full flex-row items-center gap-3 p-4 transition-colors group-hover:border-primary/40", urgent && "border-chart-3/50")}>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5", tone)}>{icon}</span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl leading-tight font-semibold tabular-nums">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </Card>
    </Link>
  );
}

/** Relative time for ISO timestamps: "5 min ago", "Yesterday 6:00 PM", "12 Oct". */
export function whenText(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 0) return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const today = new Date();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today ${time}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric", hour: "numeric", minute: "2-digit" });
}

export function TabCount({ n }: { n: number }) {
  if (!n) return null;
  return <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[0.625rem] font-semibold text-primary-foreground tabular-nums">{n}</span>;
}
