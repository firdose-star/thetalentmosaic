/**
 * Mosaic Library landing (spec §7.2–7.3): one card per area.
 */
import { ArrowRight, BookOpen, Lightbulb, Store, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

const AREAS: { href: string; icon: LucideIcon; title: string; description: string; cta: string }[] = [
  {
    href: `${ROUTES.library}/vendors`,
    icon: Store,
    title: "Vendor Directory",
    description: "A curated list of vendors that people in the Talent Mosaic Community have already worked with and can vouch for.",
    cta: "Browse vendors",
  },
  {
    href: `${ROUTES.library}/resources`,
    icon: BookOpen,
    title: "Resources",
    description: "Learning materials that might be of help.",
    cta: "Some interesting reads",
  },
  {
    href: `${ROUTES.library}/recommend`,
    icon: Lightbulb,
    title: "Recommend a Resource",
    description: "Want to share your learnings with the Community? Drop them here.",
    cta: "Share something",
  },
];

export function LibraryLanding() {
  return (
    <Stagger className="grid gap-4 @3xl/main:grid-cols-3">
      {AREAS.map(({ href, icon: Icon, title, description, cta }) => (
        <StaggerItem key={href} whileHover={{ y: -3 }}>
          <Link
            href={href}
            className="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Card className="h-full gap-3 p-6 transition-colors group-hover:border-primary/40">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-primary">
                {cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Card>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
