/**
 * Hacker News "Ask HN: Who is hiring?" — this month's thread, via the Algolia
 * HN API. Every top-level comment is one posting; emails in them are kept.
 */
import { fetchJson } from "../http";
import { htmlToText } from "../text";
import type { RawRecord } from "./types";

interface Hit {
  objectID: string;
  title?: string;
  author: string;
  created_at: string;
  comment_text?: string;
  parent_id?: number;
}

const ALGOLIA = "https://hn.algolia.com/api/v1";

export async function collectHn(): Promise<RawRecord[]> {
  const query = encodeURIComponent(`"who is hiring"`);
  const stories = await fetchJson<{ hits: Hit[] }>(`${ALGOLIA}/search_by_date?tags=story,author_whoishiring&query=${query}&hitsPerPage=10`);
  const thread = stories.hits.find((h) => /^ask hn: who is hiring\?/i.test(h.title ?? ""));
  if (!thread) throw new Error("hn: no Who is hiring? thread found");
  const storyId = Number(thread.objectID);
  const { hits } = await fetchJson<{ hits: Hit[] }>(`${ALGOLIA}/search_by_date?tags=comment,story_${storyId}&hitsPerPage=1000`);
  return hits
    .filter((h) => h.parent_id === storyId && h.comment_text)
    .map((h) => {
      const text = htmlToText(h.comment_text ?? "");
      // Posts start "Company | Role | Location | …".
      const firstLine = text.split("\n")[0];
      return {
        source: "hn",
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        companyName: firstLine.includes("|") ? firstLine.split("|")[0].trim() : undefined,
        title: firstLine.slice(0, 200),
        rawText: text,
        postedAt: new Date(h.created_at),
        posterName: h.author,
        posterUrl: `https://news.ycombinator.com/user?id=${h.author}`,
      };
    });
}
