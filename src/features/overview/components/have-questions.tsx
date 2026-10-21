/**
 * "Have questions?" — the community contact (PRD §1, §6.1).
 */
import { ExternalLink, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";

export function HaveQuestions() {
  const contact = siteConfig.communityContact;

  return (
    <Card className="flex-row flex-wrap items-center justify-between gap-4 bg-primary p-6 text-primary-foreground">
      <div>
        <h2 className="text-xl font-semibold">
          Have questions? Reach out to {contact.name}
        </h2>
        <p className="mt-1 text-sm opacity-80">
          About the community, your profile or anything on this site, just say
          hello.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          render={<a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer" />}
        >
          <MessageCircle data-icon="inline-start" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          render={<a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink data-icon="inline-start" />
          LinkedIn
        </Button>
      </div>
    </Card>
  );
}
