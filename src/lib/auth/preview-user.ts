import type { CurrentUser } from "@/types/models";

/**
 * Stand-in principals used while `NEXT_PUBLIC_AUTH_ENABLED=false`.
 *
 * The login screen's "Prototype: enter as" buttons sign you in as one of these,
 * so both the member and the admin experience are browsable before a backend
 * exists. The choice is kept in sessionStorage so a reload keeps you in.
 *
 * Never used once auth is enabled; they grant nothing — the API has no idea
 * these users exist.
 */
export type PreviewRole = "admin" | "member";

const base = {
  status: "active",
  avatarUrl: null,
  lastLoginAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
} as const;

export const PREVIEW_USERS: Record<PreviewRole, CurrentUser> = {
  admin: {
    ...base,
    id: "preview-admin",
    name: "Aarav Shah",
    email: "aarav@talentmosaic.example",
    role: "admin",
  },
  member: {
    ...base,
    id: "preview-member",
    name: "Rohan Mehta",
    email: "rohan.mehta@nimbuslabs.example",
    role: "member",
  },
};

const STORAGE_KEY = "tm.preview-role";

export function readPreviewRole(): PreviewRole | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    return value === "admin" || value === "member" ? value : null;
  } catch {
    return null;
  }
}

export function writePreviewRole(role: PreviewRole | null) {
  try {
    if (role) window.sessionStorage.setItem(STORAGE_KEY, role);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode) — the preview simply won't survive a reload.
  }
}
