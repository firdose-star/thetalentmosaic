"use client";

/**
 * "Know someone?" — members invite someone they know. One button: it copies
 * the registration form link (to send on) and opens the form in a new tab.
 */
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCopyToClipboard } from "@/hooks";
import { siteConfig } from "@/lib/config/site";
import { notify } from "@/lib/toast";

export function InviteMember() {
  const { copy } = useCopyToClipboard();
  const url = siteConfig.inviteFormUrl;

  return (
    <Card className="flex-col gap-4 border-chart-2/40 bg-linear-to-br from-accent to-card p-5 @3xl/main:flex-row @3xl/main:items-center">
      <div className="flex flex-1 items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <UserPlus className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Invite an HR professional</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Know someone who&apos;d be a great fit for our community? Invite them to register and become a part of The Talent Mosaic.
          </p>
        </div>
      </div>
      <Button
        size="lg"
        nativeButton={false}
        // A real link, so the new tab is never blocked; the click also copies it.
        render={<a href={url} target="_blank" rel="noopener noreferrer" />}
        onClick={() => {
          void copy(url).then((ok) => ok && notify.success("Invite link copied — share it with them"));
        }}
      >
        <UserPlus data-icon="inline-start" />
        Invite
      </Button>
    </Card>
  );
}
