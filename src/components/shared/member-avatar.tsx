import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A member's avatar. Initials on a tint picked from the name, so the same
 * person always gets the same colour. Real photographs replace this once
 * collected (PRD §6.2).
 */
const TINTS = [
  "bg-accent text-accent-foreground",
  "bg-chart-5/40 text-foreground",
  "bg-chart-3/30 text-foreground",
  "bg-chart-2/30 text-foreground",
  "bg-chart-4/25 text-foreground",
];

function tintFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % TINTS.length;
  return TINTS[hash];
}

export function MemberAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarFallback className={cn("text-xs font-semibold", tintFor(name))}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
