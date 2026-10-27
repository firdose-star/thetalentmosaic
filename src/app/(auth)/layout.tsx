/**
 * Neutral shell for unauthenticated screens — no sidebar, no topbar.
 *
 * `(auth)` is a route group: the parentheses keep it out of the URL, so this
 * layout applies to /login without adding an /auth segment. The first thing
 * anyone sees on opening the link is the big community greeting, set in the
 * banner's wordmark.
 */
import type { ReactNode } from "react";

import { BRAND_TAGLINE, BrandWordmark, BuiltByMesa } from "@/components/layout/brand";
import { FadeIn } from "@/components/shared/motion";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background px-6 py-12">
      {/* Soft brand glow behind the heading. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-168 -translate-x-1/2 rounded-full bg-chart-2/20 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10">
        <FadeIn className="flex flex-col items-center gap-4 text-center">
          <h1 className="flex flex-col items-center gap-3 font-heading tracking-tight">
            <span className="text-lg font-semibold text-muted-foreground sm:text-xl">Welcome to</span>
            <BrandWordmark className="text-5xl sm:text-7xl lg:text-8xl" />
            <span className="text-2xl font-bold sm:text-3xl">Community</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">{BRAND_TAGLINE}.</p>
        </FadeIn>

        <div className="w-full max-w-sm">{children}</div>
      </div>

      <BuiltByMesa className="relative mt-10" />
    </div>
  );
}
