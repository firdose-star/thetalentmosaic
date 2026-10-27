/**
 * Loads the real community (the Mastersheet exports, served by
 * /api/community/data) into the shared store before any page reads it.
 * When no export is present, every section starts empty.
 */
import { applyCommunityImport, communitySource, type CommunityImportPayload, type CommunitySource } from "@/lib/sample-data";

export async function loadCommunityData(): Promise<CommunitySource & { members?: number }> {
  try {
    const response = await fetch("/api/community/data", { cache: "no-store" });
    if (!response.ok) return { kind: "empty" };
    const data = (await response.json()) as CommunityImportPayload;
    applyCommunityImport(data);
    return { ...communitySource, members: data.members.length };
  } catch {
    return { kind: "empty" };
  }
}
