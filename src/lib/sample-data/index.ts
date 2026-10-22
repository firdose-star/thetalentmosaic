/**
 * SAMPLE dataset — the stand-in for MongoDB until the real import lands.
 *
 * Only feature *services* import from here, never components. That keeps the
 * swap to real data a one-file change per feature: replace the service body
 * with an `api.get(...)` call and delete this folder.
 */
export * from "./admin-queues";
export * from "./dates";
export * from "./events";
export * from "./jobs";
export * from "./library";
export * from "./members";
export * from "./community-store";
