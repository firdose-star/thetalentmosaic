/**
 * Loads the real community (the Community Form export, served by
 * /api/community/members) into the shared store before any page reads it.
 * Falls back to sample data when the file isn't there.
 */
import { applyCommunityImport, communitySource, type CommunitySource } from "@/lib/sample-data";
import type { CommunityImport } from "@/lib/community-import/parse";

export async function loadCommunityData(): Promise<CommunitySource & { members?: number }> {
  try {
    const response = await fetch("/api/community/members", { cache: "no-store" });
    if (!response.ok) return { kind: "sample" };
    const data = (await response.json()) as CommunityImport;
    applyCommunityImport(data);
    return { ...communitySource, members: data.members.length };
  } catch {
    return { kind: "sample" };
  }
}
