"use client";

/**
 * Session state for the whole client tree.
 *
 * Lifecycle:
 *  - On mount, attempt a silent refresh. If the httpOnly refresh cookie is still
 *    valid the backend hands back a new access token and we restore the session
 *    without a login round-trip. This is why a hard refresh keeps you signed in
 *    even though the access token only ever lived in memory.
 *  - `login` stores the access token in memory and the user in state; the backend
 *    sets the refresh cookie in the same response.
 *  - `logout` tells the backend to revoke the refresh token, clears memory, and
 *    wipes the query cache so the next user never sees the previous one's data.
 *
 * Consume via `useAuth()` from `@/hooks/use-auth` — not by importing this context.
 */
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api, refreshAccessToken } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/http-error";
import { clearAuth, setAccessToken } from "@/lib/auth/token-store";
import {
  PREVIEW_USERS,
  readPreviewRole,
  writePreviewRole,
  type PreviewRole,
} from "@/lib/auth/preview-user";
import { env } from "@/lib/config/env";
import type { AuthSession, CurrentUser } from "@/types/models";

export interface AuthContextValue {
  user: CurrentUser | null;
  /** True until the initial silent-refresh attempt settles. Gate redirects on this. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  /** Re-read `/auth/me`, e.g. after the user edits their own profile. */
  refreshUser: () => Promise<void>;
  /**
   * Sign in as a preview member or admin. Only works while
   * `NEXT_PUBLIC_AUTH_ENABLED=false` — the login screen's prototype buttons.
   */
  enterPreview: (role: PreviewRole) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session once, on mount.
  useEffect(() => {
    let cancelled = false;

    // With the gate off, restore whichever preview role was picked on the
    // login screen. Deferred a tick so state is never set synchronously in the
    // effect, and so server and first client render agree (both signed out).
    if (!env.NEXT_PUBLIC_AUTH_ENABLED) {
      void Promise.resolve().then(() => {
        if (cancelled) return;
        const role = readPreviewRole();
        setUser(role ? PREVIEW_USERS[role] : null);
        setIsLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const restored = await refreshAccessToken();
        if (!restored) return;
        const me = await api.get<CurrentUser>(ENDPOINTS.auth.me);
        if (!cancelled) setUser(me);
      } catch (error) {
        // A 401 here just means "no valid session" — not an app error.
        if (!cancelled && !(isApiError(error) && error.isUnauthorized)) {
          console.error("Failed to restore session", error);
        }
        clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async (input) => {
      const session = await api.post<AuthSession>(
        ENDPOINTS.auth.login,
        input,
        { skipAuth: true },
      );
      setAccessToken(session.accessToken, session.expiresIn);
      setUser(session.user);
      return session.user;
    },
    [],
  );

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    if (!env.NEXT_PUBLIC_AUTH_ENABLED) {
      writePreviewRole(null);
      setUser(null); // lets you see the signed-out UI without a backend
      queryClient.clear();
      return;
    }
    try {
      await api.post(ENDPOINTS.auth.logout);
    } catch {
      // Revoking server-side is best-effort; clearing locally must still happen.
    } finally {
      clearAuth();
      setUser(null);
      queryClient.clear(); // never leak the previous user's cached data
    }
  }, [queryClient]);

  const refreshUser = useCallback<AuthContextValue["refreshUser"]>(async () => {
    const me = await api.get<CurrentUser>(ENDPOINTS.auth.me);
    setUser(me);
  }, []);

  const enterPreview = useCallback<AuthContextValue["enterPreview"]>(
    (role) => {
      if (env.NEXT_PUBLIC_AUTH_ENABLED) return;
      writePreviewRole(role);
      queryClient.clear();
      setUser(PREVIEW_USERS[role]);
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshUser,
      enterPreview,
    }),
    [user, isLoading, login, logout, refreshUser, enterPreview],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
