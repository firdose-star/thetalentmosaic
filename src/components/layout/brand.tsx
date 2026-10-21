/**
 * Brand marks for The Talent Mosaic.
 *
 * Everything visual about the identity lives here: the logo glyph, the wordmark,
 * the tagline and the "Built by Mesa School of Business" footer (PRD §5: on
 * every page, including login). Change the brand once, and the sidebar, the
 * login screen, the landing page, and the footer all follow.
 */
import Link from "next/link";

import { cn } from "@/lib/utils";

export const BRAND_NAME = "The Talent Mosaic";
export const BRAND_TAGLINE = "A peer led community of HRs across startups";

/** The logo glyph alone — two interlocking arcs. Inherits `currentColor`. */
export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden
      className={cn("size-4", className)}
    >
      <path
        d="M 50 10 A 40 40 0 1 1 50 90 L 50 70 A 20 20 0 1 0 50 30 Z M 50 10 A 40 40 0 0 1 90 50 L 70 50 A 20 20 0 0 0 50 30 Z"
        transform="rotate(45 50 50)"
      />
    </svg>
  );
}

/** The mark: the glyph in a soft mint tile. Pure SVG/CSS — no image asset. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary",
        className,
      )}
    >
      <LogoGlyph className="size-[55%]" />
    </span>
  );
}

export function BrandWordmark({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 flex-col leading-none", className)}>
      <span className="truncate font-heading text-base font-bold tracking-tight">
        {BRAND_NAME}
      </span>
      {showTagline && <BrandTagline className="mt-1" />}
    </span>
  );
}

/** The small line under the wordmark. */
export function BrandTagline({ className }: { className?: string }) {
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {BRAND_TAGLINE}
    </span>
  );
}

/** Mark + wordmark, linking home. Use in the sidebar header and auth screens. */
export function Brand({
  href = "/",
  showTagline = false,
  className,
}: {
  href?: string;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${BRAND_NAME}, back to Overview`}
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-md outline-none transition-opacity",
        "hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <BrandMark />
      <BrandWordmark showTagline={showTagline} />
    </Link>
  );
}

/** The footer credit. PRD §5: on every page, including login. */
export function BuiltByMesa({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <LogoGlyph className="size-3.5 text-primary" />
      Built by Mesa School of Business
    </p>
  );
}
