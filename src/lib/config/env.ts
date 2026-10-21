/**
 * Zod-validated environment access.
 *
 * RULES
 * - Never read `process.env` anywhere else in the app. Import `env` / `serverEnv` from here.
 * - Every NEXT_PUBLIC_* var must be referenced as a *literal* below so Next inlines it at build time.
 *   `process.env[someVariable]` does NOT work in client bundles.
 * - Adding a var? Add it in three places: the schema here, `.env.example`, and your `.env.local`.
 */
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*  Public env — safe to ship to the browser                                   */
/* -------------------------------------------------------------------------- */

const publicSchema = z.object({
  /** Origin of this Next app. Used for absolute URLs, metadataBase, OG images. */
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  /** Base URL of the backend REST API, including the version prefix. */
  NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:4000/api/v1"),
  /** Optional explicit Swagger/Redoc URL. Falls back to API base minus /api/v1. */
  NEXT_PUBLIC_API_DOCS_URL: z.url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("AI CTO"),
  /**
   * Master switch for the auth gate.
   *
   * `false` (the boilerplate default) leaves every route publicly reachable and
   * signs you in as a preview user, so the whole UI is browsable before a
   * backend exists. Set it to `true` the moment you have a real API — the gate
   * code in `proxy.ts` and `<AuthGate>` is already written and wired.
   */
  NEXT_PUBLIC_AUTH_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_API_DOCS_URL: process.env.NEXT_PUBLIC_API_DOCS_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_AUTH_ENABLED: process.env.NEXT_PUBLIC_AUTH_ENABLED,
});

if (!parsedPublic.success) {
  const message =
    "Invalid public environment variables: " +
    JSON.stringify(z.flattenError(parsedPublic.error).fieldErrors);
  // Hard-fail a production build; warn (and fall back to defaults) in dev.
  if (process.env.NODE_ENV === "production") throw new Error(message);
  console.warn(message);
}

export const env = parsedPublic.success
  ? parsedPublic.data
  : publicSchema.parse({});

export type Env = typeof env;

/* -------------------------------------------------------------------------- */
/*  Server-only env — never imported from a Client Component                   */
/* -------------------------------------------------------------------------- */

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  /**
   * Internal API URL used by Route Handlers / Server Components.
   * Lets server-side calls skip the public ingress (e.g. a private VPC hostname).
   */
  API_INTERNAL_BASE_URL: z.url().optional(),
  /** Name of the httpOnly refresh cookie issued by the backend. */
  SESSION_COOKIE_NAME: z.string().min(1).default("refresh_token"),

  /* ── MongoDB (Tier 1 only) ───────────────────────────────────────────────
   * MONGODB_URI contains a password. Never NEXT_PUBLIC_, never read from a
   * Client Component. See src/lib/db/README.md.
   */
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB: z.string().min(1).optional(),
  MONGODB_POOL_MAX: z.coerce.number().default(10),
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

/**
 * Access server-only env. Throws if called in the browser so a leak fails loudly
 * at runtime instead of silently shipping a secret.
 */
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() was called in the browser.");
  }
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    API_INTERNAL_BASE_URL: process.env.API_INTERNAL_BASE_URL,
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    MONGODB_POOL_MAX: process.env.MONGODB_POOL_MAX,
  });

  if (!parsed.success) {
    throw new Error(
      "Invalid server environment variables: " +
        JSON.stringify(z.flattenError(parsed.error).fieldErrors),
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/** Base URL for the backend's API documentation (Swagger / Redoc host). */
export function getApiDocsBaseUrl() {
  return (
    env.NEXT_PUBLIC_API_DOCS_URL ??
    env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v\d+\/?$/, "")
  );
}

export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = process.env.NODE_ENV === "development";
