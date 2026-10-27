/**
 * Brand marks for The Talent Mosaic.
 *
 * Everything visual about the identity lives here: the logo glyph, the wordmark
 * (drawn to match the community banner, `public/brand/talent-mosaic-banner.png`),
 * the Mesa School of Business logo and the "Built by" footer (PRD §5: on every
 * page, including login). Change the brand once, and the sidebar, the login
 * screen and the footer all follow.
 */
import Link from "next/link";

import { cn } from "@/lib/utils";

export const BRAND_NAME = "The Talent Mosaic";
export const BRAND_TAGLINE = "A peer led community of HRs across startups";

/** The banner's warm orange for "Talent". */
const TALENT_ORANGE = "#F5AC62";

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

/**
 * "The Talent Mosaic" set like the banner: a script "The" tucked above a
 * serif-italic "Talent" (orange) and "Mosaic" (brand green). Size it with a
 * text-* class; everything scales in `em`. `inverse` is for dark surfaces such
 * as the sidebar.
 */
export function BrandWordmark({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <span
      aria-label={BRAND_NAME}
      className={cn("relative inline-block whitespace-nowrap pt-[0.42em] leading-none", className)}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0 left-[-0.06em] text-[0.62em] leading-none",
          inverse ? "text-sidebar-primary" : "text-primary",
        )}
        style={{ fontFamily: "var(--font-brand-script)" }}
      >
        The
      </span>
      <span aria-hidden className="font-bold italic" style={{ fontFamily: "var(--font-brand-serif)" }}>
        <span style={{ color: TALENT_ORANGE }}>Talent</span>{" "}
        <span className={inverse ? "text-sidebar-foreground" : "text-primary"}>Mosaic</span>
      </span>
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

/** Wordmark linking home. Use in the sidebar header. */
export function Brand({
  href = "/",
  inverse = false,
  className,
}: {
  href?: string;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${BRAND_NAME}, back to Overview`}
      className={cn(
        "flex min-w-0 items-center rounded-md outline-none transition-opacity",
        "hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <BrandWordmark inverse={inverse} className="text-xl" />
    </Link>
  );
}

/**
 * The Mesa School of Business logo: the "m" tile plus the name. Drawn in
 * `currentColor` with the "m" knocked out of the tile, so it reads on light,
 * dark and black surfaces alike. Size it with a height class.
 */
export function MesaLogo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span
      role="img"
      aria-label="Mesa School of Business"
      className={cn("inline-flex h-7 items-center gap-[0.3em]", className)}
    >
      <svg viewBox="0 0 40 40" className="aspect-square h-full" aria-hidden>
        <mask id="mesa-m">
          <rect width="40" height="40" fill="white" />
          <rect x="9" y="9" width="22" height="2.6" rx="0.5" fill="black" />
          <path
            d="M9 31V17.5c0-2.2 1.6-3.8 3.8-3.8h0.6c1.6 0 2.9.8 3.6 2.1c.7-1.3 2-2.1 3.6-2.1h.8c1.6 0 2.9.8 3.6 2.1c.7-1.3 2-2.1 3.6-2.1h.6c2.2 0 3.8 1.6 3.8 3.8V31h-3.4V18.2c0-.8-.6-1.3-1.3-1.3h-.4c-.8 0-1.3.6-1.3 1.3V31h-3.4V18.2c0-.8-.6-1.3-1.3-1.3h-.4c-.8 0-1.3.6-1.3 1.3V31h-3.4V18.2c0-.8-.6-1.3-1.3-1.3h-.4c-.8 0-1.3.6-1.3 1.3V31Z"
            fill="black"
          />
        </mask>
        <rect width="40" height="40" rx="7" fill="currentColor" mask="url(#mesa-m)" />
      </svg>
      {showName && (
        <span className="flex flex-col justify-center leading-none">
          <span className="text-[0.78em] font-bold tracking-tight">Mesa</span>
          <span className="mt-[0.12em] text-[0.27em] font-medium tracking-wide uppercase">
            School of Business
          </span>
        </span>
      )}
    </span>
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
      Built by
      <a
        href="https://mesaschool.co"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm text-foreground outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <MesaLogo className="h-6 text-[1.6rem]" />
      </a>
    </p>
  );
}
