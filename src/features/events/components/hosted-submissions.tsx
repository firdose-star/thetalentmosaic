"use client";

/**
 * Hosted sessions awaiting review. Admins approve or reject each one; a
 * member sees the status of their own submissions.
 */
import { Check, Clock, X } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { shortDate } from "@/lib/community";
import { useEventAdminActions } from "../hooks/use-events";
import type { HostedSubmission } from "../services/events.service";

export function HostedSubmissions({ submissions }: { submissions: HostedSubmission[] }) {
  const { user } = useAuth();
  const { review } = useEventAdminActions();
  const isAdmin = user?.role === "admin";

  if (submissions.length === 0) return null;

  return (
    <Section
      title={isAdmin ? "Sessions waiting for approval" : "Your submitted sessions"}
      description={isAdmin ? "Approve to publish it under Upcoming Events, marked as hosted by the member." : "The admins will publish these once approved."}
    >
      <ul className="flex flex-col divide-y">
        {submissions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">
                {shortDate(s.date, true)} · {s.time} · 📍 {s.city} · {s.cost === "Free" ? "Free" : `Paid · ${s.price}`}
                {isAdmin && <> · by {s.hostName}</>}
              </p>
            </div>
            {s.status === "rejected" ? (
              <Badge variant="outline" className="text-destructive">Not approved</Badge>
            ) : isAdmin ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => review.mutate({ id: s.id, approve: true })}>
                  <Check data-icon="inline-start" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => review.mutate({ id: s.id, approve: false })}>
                  <X data-icon="inline-start" />
                  Reject
                </Button>
              </div>
            ) : (
              <Badge variant="secondary" className="gap-1"><Clock className="size-3" />Pending approval</Badge>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
