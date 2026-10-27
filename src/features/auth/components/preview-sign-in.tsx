"use client";

/**
 * "Prototype: enter as" — signs in as a preview member or admin without a
 * backend. Renders nothing once `NEXT_PUBLIC_AUTH_ENABLED=true`, so it can
 * stay on the login page until real sign-in replaces it.
 */
import { ShieldCheck, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { PreviewRole } from "@/lib/auth/preview-user";
import { env } from "@/lib/config/env";
import { REDIRECT_PARAM, ROUTES } from "@/lib/constants";

export function PreviewSignIn() {
  const { enterPreview } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (env.NEXT_PUBLIC_AUTH_ENABLED) return null;

  function enter(role: PreviewRole) {
    enterPreview(role);
    const requested = searchParams.get(REDIRECT_PARAM);
    // Only same-origin paths — never bounce to an attacker-supplied URL.
    const safe =
      requested && requested.startsWith("/") && !requested.startsWith("//")
        ? requested
        : null;
    router.replace(safe ?? ROUTES.overview);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Prototype: enter as
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => enter("member")}>
          <User data-icon="inline-start" />
          A member
        </Button>
        <Button onClick={() => enter("admin")}>
          <ShieldCheck data-icon="inline-start" />
          An admin
        </Button>
      </div>
    </div>
  );
}
