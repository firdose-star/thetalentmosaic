/**
 * Company type, years of experience and employment type, read from a posting
 * by rules — used when Claude isn't set up, to fill what Claude left empty,
 * and to classify roles stored before these fields existed. Anything the
 * posting doesn't make clear stays "other" / "unknown", which the filters
 * show as "Other".
 */
import type { EmploymentType, Industry } from "@/types/roles";

/** Most specific first: "an HR-tech staffing firm" is HR services, not SaaS. */
const INDUSTRY_RULES: [Industry, RegExp][] = [
  ["hr_services", /\b(staffing|recruitment (agency|firm|company|partner)|executive search|hr services|hr solutions|talent solutions|talent as a service|talent mobility|global mobility|employee lifecycle|human capital|rpo|manpower|placement (agency|consultants?)|hr consult\w*|hrms)\b/i],
  ["healthtech", /\b(health\s?tech|health ?care|healthcare|hospitals?|clinics?|medical|pharma\w*|biotech\w*|diagnostics?|patients?|wellness|telemedicine|psychiatr\w*)\b/i],
  ["fintech", /\b(fin\s?tech|payments?|banking|banks?|lending|lender|nbfc|insurance|insurtech|wealth|financial services|credit|upi|trading|investments?|neo-?bank|stock ?broking|mutual funds?)\b/i],
  ["edtech", /\b(ed\s?tech|education\w*|e-?learning|learning platform|schools?|universit(y|ies)|teachers?|students?|upskilling|test prep|skills? development)\b/i],
  ["d2c", /\b(d2c|dtc|direct[- ]to[- ]consumer|consumer brands?|beauty|skin ?care|cosmetics|apparel|fashion|eyewear|personal care|fmcg|consumer goods|kids|babies|jewell?ery|footwear|home d[ée]cor)\b/i],
  ["foodtech", /\b(food\s?tech|food delivery|restaurants?|cloud kitchens?|beverages?|grocery|groceries|dairy|snacks)\b/i],
  ["agritech", /\b(agri\s?tech|agri\w*|farm\w*)\b/i],
  ["climate_energy", /\b(climate|renewable\w*|solar|clean energy|wind energy|sustainab\w*|net[- ]zero|carbon|battery|batteries|energy)\b/i],
  ["travel_hospitality", /\b(travel|hospitality|hotels?|tourism|resorts?)\b/i],
  ["proptech", /\b(prop\s?tech|real estate|property|properties|co-?living|co-?working|construction|infrastructure)\b/i],
  ["mobility_logistics", /\b(logistics|mobility|supply chain|fleet|last[- ]mile|shipping|freight|transport\w*|automotive|electric vehicles?|\bev\b|ride[- ]hailing)\b/i],
  ["manufacturing", /\b(manufactur\w*|industrial|steel|textiles?|chemicals?|factory|plants?|gypsum|defen[cs]e|semiconductors?|machinery|cement|automobile)\b/i],
  ["ecommerce", /\b(e-?commerce|marketplace|online shopping|quick commerce|q-?commerce|retail\w*|online store)\b/i],
  ["media_gaming", /\b(media|entertainment|gaming|games?|audio|video|content|music|streaming|advertising|publishing|ott)\b/i],
  ["it_services", /\b(it services|consulting|consultancy|outsourc\w*|bpo|kpo|digital transformation|professional services|global business services|shared services|technology services)\b/i],
  ["ai_deeptech", /\b(ai|artificial intelligence|machine learning|llms?|generative|gen ?ai|deep ?tech|robotics|computer vision|quantum)\b/i],
  ["saas", /\b(saas|software|b2b|cloud|enterprise platform|developer tools|crm|erp|cyber ?security|devops|api platform|workflow)\b/i],
];

const firstIndustry = (text: string) => INDUSTRY_RULES.find(([, re]) => re.test(text))?.[0];

/**
 * LinkedIn's own "Industries:" line is the most reliable signal; then the
 * company summary; then the opening of the posting (where companies describe
 * themselves). The job's duties are deliberately not read — an HR role at a
 * bank mentions "payroll", not banking.
 */
export function industryFrom({ rawText, summary, companyName }: { rawText: string; summary?: string; companyName?: string }): Industry {
  const industries = rawText.match(/^Industries: (.+)$/m)?.[1];
  return (
    (industries && firstIndustry(industries)) ||
    (summary && firstIndustry(summary)) ||
    firstIndustry(rawText.match(/^About [^\n]{0,80}: (.+)$/m)?.[1] ?? "") ||
    (companyName && firstIndustry(companyName)) ||
    "other"
  );
}

const YEARS = String.raw`(?:years?|yrs?)`;
const RANGE = new RegExp(String.raw`(\d{1,2}(?:\.\d)?)\s*(?:-|–|—|to)\s*(\d{1,2}(?:\.\d)?)\+?\s*${YEARS}`, "i");
const PLUS = new RegExp(String.raw`(\d{1,2})\s*(?:\+|plus)\s*${YEARS}`, "i");
const AT_LEAST = new RegExp(String.raw`(?:minimum|min\.?|at least|atleast)\s*(?:of\s*)?(\d{1,2})\s*${YEARS}`, "i");
const N_YEARS_EXP = new RegExp(String.raw`(\d{1,2})\s*${YEARS}(?:'|’)?\s*(?:of\s+)?(?:[\w&/-]+\s+){0,5}experience`, "i");

/** Years of experience the posting asks for, if it says. */
export function experienceFrom({ rawText, title }: { rawText: string; title: string }): { minYears?: number; maxYears?: number; text?: string } {
  if (/\bintern(ship)?s?\b|\bfreshers?\b|\btrainee\b/i.test(title)) return { minYears: 0, text: "Freshers / interns" };
  for (const re of [RANGE, PLUS, AT_LEAST, N_YEARS_EXP]) {
    const m = rawText.match(re);
    if (!m) continue;
    const min = Math.floor(Number(m[1]));
    const max = m[2] !== undefined && re === RANGE ? Math.ceil(Number(m[2])) : undefined;
    // "2025 years", "100 years of history" — not an experience ask.
    if (min > 30 || (max !== undefined && (max > 40 || max < min))) continue;
    return { minYears: min, ...(max !== undefined ? { maxYears: max } : {}), text: m[0].trim() };
  }
  return {};
}

/** Employment type from the source's own field and the title, then explicit phrases in the posting. */
export function employmentTypeFrom({ commitment, title, rawText }: { commitment?: string; title: string; rawText: string }): EmploymentType {
  const head = `${commitment ?? ""} ${title}`;
  if (/\bintern(ship)?s?\b|\btrainee\b/i.test(head)) return "internship";
  if (/\b(contract|contractual|freelance|temporary|temp|fixed[- ]term|consultant)\b/i.test(head)) return "contract";
  if (/\bpart[- ]time\b/i.test(head)) return "part_time";
  if (/\b(full[- ]time|permanent|regular)\b/i.test(head)) return "full_time";

  const body = rawText.slice(0, 4000);
  if (/^Employment type: (.+)$/im.test(body)) {
    return employmentTypeFrom({ commitment: body.match(/^Employment type: (.+)$/im)?.[1], title: "", rawText: "" });
  }
  if (/\binternship\b/i.test(body)) return "internship";
  if (/\b(contract|contractual|fixed[- ]term) (role|position|basis|engagement)\b/i.test(body)) return "contract";
  if (/\bpart[- ]time\b/i.test(body)) return "part_time";
  if (/\b(full[- ]time|permanent (role|position))\b/i.test(body)) return "full_time";
  return "unknown";
}
