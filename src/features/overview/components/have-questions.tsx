/**
 * "Have questions?" — the community contact (PRD §1, §6.1). Email always;
 * WhatsApp and LinkedIn appear once they're set in `site.ts`.
 */
import { ExternalLink, Mail, MessageCircle } from "lucide-react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";

export function HaveQuestions() {
  const contact = siteConfig.communityContact;

  return (
    <Card className="flex-col gap-4 bg-accent/60 p-5 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-3">
        <MemberAvatar name={contact.name} className="size-11" />
        <div>
          <h2 className="text-base font-semibold">Have questions? Reach out to {contact.name}</h2>
          <p className="text-sm text-muted-foreground">
            About the community, your profile or anything on this site — just say hello.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<a href={`mailto:${contact.email}`} />}>
          <Mail data-icon="inline-start" />
          Email {contact.name}
        </Button>
        {contact.whatsappUrl && (
          <Button variant="outline" nativeButton={false} render={<a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer" />}>
            <MessageCircle data-icon="inline-start" />
            WhatsApp
          </Button>
        )}
        {contact.linkedinUrl && (
          <Button variant="outline" nativeButton={false} render={<a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" />}>
            <ExternalLink data-icon="inline-start" />
            LinkedIn
          </Button>
        )}
      </div>
    </Card>
  );
}
