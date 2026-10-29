/** Lever public postings API — one company per slug. */
import { fetchJson } from "../http";
import { htmlToText } from "../text";
import type { CollectorTarget, RawRecord } from "./types";

interface LeverPosting {
  text: string;
  categories?: { location?: string; commitment?: string; team?: string };
  descriptionPlain?: string;
  lists?: { text: string; content: string }[];
  additionalPlain?: string;
  hostedUrl: string;
  createdAt?: number;
  workplaceType?: string;
}

export async function collectLever({ slug, companyName }: CollectorTarget): Promise<RawRecord[]> {
  if (!slug) throw new Error("lever: missing slug");
  const postings = await fetchJson<LeverPosting[]>(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`);
  return postings.map((p) => {
    const c = p.categories ?? {};
    const lists = (p.lists ?? []).map((l) => `${l.text}\n${htmlToText(l.content)}`).join("\n\n");
    return {
      source: "lever",
      url: p.hostedUrl,
      companyName: companyName ?? slug,
      title: p.text,
      rawText: [
        p.text,
        `Location: ${c.location ?? "not stated"}${c.commitment ? ` · ${c.commitment}` : ""}${c.team ? ` · Team: ${c.team}` : ""}`,
        p.descriptionPlain ?? "",
        lists,
        p.additionalPlain ?? "",
      ].filter(Boolean).join("\n\n"),
      postedAt: p.createdAt ? new Date(p.createdAt) : undefined,
      meta: { location: c.location, commitment: c.commitment, remote: p.workplaceType === "remote" },
    };
  });
}
