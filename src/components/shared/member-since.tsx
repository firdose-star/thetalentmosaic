"use client";

/**
 * "Mosaic Member since 3 months" — live, from the joining date to today.
 * Shown under every community member.
 *
 * Renders after mount only: "today" differs between server and browser, and
 * a mismatched label would trip hydration.
 */
import { Sprout } from "lucide-react";

import { useMounted } from "@/hooks/use-mounted";
import { memberSince } from "@/lib/community";
import { cn } from "@/lib/utils";

export function MemberSince({
  joinedOn,
  className,
}: {
  joinedOn: string;
  className?: string;
}) {
  const mounted = useMounted();
  const label = mounted ? memberSince(joinedOn) : null;

  return (
    <span
      className={cn(
        "inline-flex min-h-5 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap text-primary",
        className,
      )}
    >
      <Sprout className="size-3" aria-hidden />
      {!label ? "Mosaic Member" : label.startsWith("Member since") ? `Mosaic ${label}` : label}
    </span>
  );
}
