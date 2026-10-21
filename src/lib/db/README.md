# `src/lib/db` — talking to a database directly

> **Most projects using this boilerplate should not touch this folder.**
> The default architecture is: browser → `@/lib/api/client` → a separate backend
> that owns the database. If you have that backend, delete this folder.

This exists for **Tier 1** — one Next.js app, no separate service, where Route
Handlers *are* the API and the database is reached from this app.

The database is **MongoDB**, in [`mongodb/`](mongodb/).

| | `mongodb/` |
| --- | --- |
| Shape | documents |
| Migrations | none — write your own script |
| **Authorization** | **none — every query must filter by owner** |

---

## The difference that actually matters

This is not a preference about query syntax. It is where authorization lives.

MongoDB has no database-level authorization. Nothing checks ownership except the
query you wrote. A `findById` without an owner filter returns another user's
document and nothing objects — no error, no warning, no symptom.

Mongo gives you schema freedom and asks for discipline in return: an owner
filter in every query, enforced by keeping all queries in a repository.

---

## The rule

**Never query the database from a Client Component.** These modules are
server-only — Server Components, Route Handlers and Server Actions. Importing
them into a `"use client"` file either fails the build or ships credentials to
the browser.

The data path stays the same as everywhere else in this app:

```
component → hook → service → (Route Handler | Server Component) → db
```

A component that imports `@/lib/db/*` directly is a bug, for the same reason a
component that calls `fetch` directly is a bug: it removes the seam where auth,
errors and caching are handled once.

---

## Setup

[`mongodb/README.md`](mongodb/README.md) has the install command, the
environment variables, and the first thing to verify.

Then follow your kit's `03-database.md` guide, which builds the schema by
interviewing you about your nouns and who owns each one — because that ownership
chain *is* your security model.
