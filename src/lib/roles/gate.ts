/**
 * The keyword gate (spec §5): a collected posting goes on to extraction only
 * when its title, or the first 600 characters of its text, reads like an HR /
 * People / Talent role. Manual URL submissions skip it.
 */
import type { RawRecord } from "./collectors";

export const HR_GATE =
  /talent acquisition|recruit(er|ing|ment)|hrbp|hr business partner|people (ops|operations|partner|team|lead|head)|head of people|chief people|chro|human resources|hr (generalist|manager|lead|head|executive|intern|associate)|l&d|learning (and|&) development|compensation|total rewards|employer brand(ing)?|talent partner|ta (lead|manager|partner|specialist)/i;

export const passesGate = (record: Pick<RawRecord, "title" | "rawText">) =>
  HR_GATE.test(record.title ?? "") || HR_GATE.test(record.rawText.slice(0, 600));
