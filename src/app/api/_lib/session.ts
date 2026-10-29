/**
 * Who is calling a Route Handler. SERVER ONLY.
 *
 * Login isn't built yet, so this is deliberately a stub with one safe rule:
 *
 *   auth enabled   → nobody is signed in until session verification lands
 *                    here (verify the access token, return the user's role
 *                    with `authenticated: true`).
 *   auth disabled  → the preview "Enter as member / admin" choice, sent by
 *                    the browser as `x-preview-role`, is honoured ONLY on a
 *                    development server. A production build treats every
 *                    preview caller as anonymous — a header anyone can set
 *                    is never a credential on a public URL.
 *
 * Preview callers are never `authenticated`, so contact details stay hidden
 * from them while ROLES_CONTACTS_REQUIRE_AUTH is on.
 */
import "server-only";

import { env, isDevelopment } from "@/lib/config/env";
import type { Role } from "@/types/enums";

export interface Caller {
  role: Role;
  name: string;
  /** A verified session (not the preview stand-in). */
  authenticated: boolean;
}

export const PREVIEW_ROLE_HEADER = "x-preview-role";

export async function getCaller(request: Request): Promise<Caller | null> {
  if (env.NEXT_PUBLIC_AUTH_ENABLED) return null;
  if (!isDevelopment) return null;
  const role = request.headers.get(PREVIEW_ROLE_HEADER);
  if (role === "admin") return { role, name: "Admin (preview)", authenticated: false };
  if (role === "member") return { role, name: "Member (preview)", authenticated: false };
  return null;
}

export const isAdmin = (caller: Caller | null): caller is Caller => caller?.role === "admin";
/** Any signed-in user — members, managers and admins all count. */
export const isMember = (caller: Caller | null): caller is Caller => caller !== null;
