/**
 * Neutral shell for unauthenticated screens — no sidebar, no topbar.
 *
 * `(auth)` is a route group: the parentheses keep it out of the URL, so this
 * layout applies to /login without adding an /auth segment.
 */
import type { ReactNode } from "react";

import {
  BRAND_NAME,
  BrandMark,
  BrandTagline,
  BuiltByMesa,
} from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background px-6 py-12">
      <div className="mx-auto grid w-full max-w-sm flex-1 content-center">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12 rounded-xl" />
          <div>
            <p className="font-heading text-2xl font-bold tracking-tight">
              {BRAND_NAME}
            </p>
            <BrandTagline className="mt-1 block" />
          </div>
        </div>

        {children}
      </div>

      <BuiltByMesa className="mt-10" />
    </div>
  );
}
