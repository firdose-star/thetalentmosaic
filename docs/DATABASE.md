# Talking to a database directly

> **Most projects using this boilerplate should not.** The default is: browser →
> `@/lib/api/client` → a separate backend that owns the database. If you have
> that backend, delete `src/lib/db/` and stop reading.

This is for **Tier 1** — one Next.js app, no separate service, Route Handlers as
the API. The database is **MongoDB**.

| | MongoDB |
| --- | --- |
| Shape | documents |
| Migrations | none — write your own scripts |
| **Authorization** | **none — your query is the only check** |
| Failure mode | a `findById` without an owner filter leaks, **silently** |

Full setup: [`../src/lib/db/mongodb/README.md`](../src/lib/db/mongodb/README.md)

## The difference that actually matters

Not query syntax — **where authorization lives**.

MongoDB has no policy layer. Nothing checks ownership except the query you
wrote. Your job is an owner filter in every query, and the structure — all
queries in a repository, `ownerId` a required parameter — is what makes that
auditable.

## The rule

**Never query from a Client Component.** These modules are server-only: Server
Components, Route Handlers, Server Actions. The data path does not change:

```
component → hook → service → (Route Handler | Server Component) → db
```

A component importing `@/lib/db/*` is a bug for the same reason a component
calling `fetch` is a bug — it removes the seam where auth, errors and caching are
handled once.

## Migrations

There are none, and that is not automatically good news. Mongo accepts a
document of any shape, so a renamed field means old and new documents coexist
silently. Write idempotent scripts under `scripts/migrations/` and run them
deliberately. "Schemaless" moves the migration from the database into your head.

## Before you ship

Per collection, as user A, attempt to read, update and delete user B's document.
Every one must fail. **Every collection**, not a sample: there is no policy layer
to catch the one you skipped.
