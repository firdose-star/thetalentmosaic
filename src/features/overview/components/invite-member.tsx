"use client";

/**
 * "Know an HR professional?" — members invite someone they know by sharing
 * the registration form. Open it, copy the link, or send it on WhatsApp.
 */
import { Check, Copy, ExternalLink, MessageCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCopyToClipboard } from "@/hooks";
import { siteConfig } from "@/lib/config/site";

const INVITE_MESSAGE = `I think you'd be a great fit for The Talent Mosaic — a peer-led community of HR professionals across startups. Register here: ${siteConfig.inviteFormUrl}`;

export function InviteMember() {
  const { copied, copy } = useCopyToClipboard();
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
            Know an HR professional who&apos;d be a great fit for our community? Invite them to register and become a part of The Talent Mosaic.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<a href={url} target="_blank" rel="noopener noreferrer" />}>
          <ExternalLink data-icon="inline-start" />
          Open invite form
        </Button>
        <Button variant="outline" onClick={() => void copy(url)}>
          {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          {copied ? "Link copied" : "Copy link"}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={`https://wa.me/?text=${encodeURIComponent(INVITE_MESSAGE)}`} target="_blank" rel="noopener noreferrer" />}
        >
          <MessageCircle data-icon="inline-start" />
          Share on WhatsApp
        </Button>
      </div>
    </Card>
  );
}
