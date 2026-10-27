/**
 * Loads the real community (the Mastersheet exports, served by
 * /api/community/data) into the shared store before any page reads it.
 * When no export is present (404), every section starts empty; any other
 * failure throws, so the gate can show it and retry instead of quietly
 * rendering an empty dashboard.
 */
import { applyCommunityImport, communitySource, communityStore, type CommunityImportPayload, type CommunitySource } from "@/lib/sample-data";

export async function loadCommunityData(): Promise<CommunitySource & { members?: number }> {
  const response = await fetch("/api/community/data", { cache: "no-store" });
  if (response.status === 404) return { kind: "empty" };
  if (!response.ok) throw new Error(`Could not load the community data (HTTP ${response.status}).`);
  const data = (await response.json()) as CommunityImportPayload;
  applyCommunityImport(data);
  return { ...communitySource, members: data.members.length };
}

/**
 * True when an import that did load is no longer in the store — the store
 * module was re-evaluated (a dev hot reload), so it must be loaded again.
 */
export function communityDataLost(loaded: CommunitySource & { members?: number }): boolean {
  return loaded.kind === "mastersheet" && (loaded.members ?? 0) > 0 && communityStore.members.length === 0;
}
