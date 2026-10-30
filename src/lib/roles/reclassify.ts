/**
 * Re-read every stored role's company type, years of experience and
 * employment type from the posting text kept on the server. Fills only what
 * is missing or unclear — an admin's edits and Claude's answers are kept.
 */
import "server-only";

import { allForReclassify, updateRole } from "@/lib/db/mongodb/roles.repository";
import { experienceBand } from "@/types/roles";

import { employmentTypeFrom, experienceFrom, industryFrom } from "./classify";

export async function reclassifyRoles() {
  const docs = await allForReclassify();
  let changed = 0;
  for (const doc of docs) {
    const rawText = doc.sources.map((s) => s.rawText ?? "").join("\n\n");
    const commitment = rawText.match(/^Employment type: (.+)$/m)?.[1];
    const industry = doc.industry && doc.industry !== "other" ? doc.industry : industryFrom({ rawText, summary: doc.description, companyName: doc.company.name });
    const experience = doc.experience?.minYears !== undefined ? doc.experience : experienceFrom({ rawText, title: doc.title });
    const employmentType = doc.employmentType !== "unknown" ? doc.employmentType : employmentTypeFrom({ commitment, title: doc.title, rawText });
    await updateRole(doc._id, { $set: { industry, experience, experienceBand: experienceBand(experience.minYears), employmentType } });
    changed++;
  }
  return { roles: changed };
}
