/**
 * What the Opportunities board keeps — checked before extraction (cheap, on
 * what the source gave) and again after it (on what Claude read):
 *
 *  1. HR roles only: HR, Talent Acquisition, People & Culture and the other HR
 *     functions — decided by the job TITLE. Sales, customer success,
 *     engineering and the like are out, even when HR words appear in them
 *     ("Sales Compensation Analyst", "Engineering Manager, People Platform").
 *  2. In India, or remote (and not remote-only-somewhere-else).
 *  3. Posted within the last 60 days.
 *
 * Manual URL submissions skip 1 and 2 — the team asked for them — but are
 * flagged when they fail.
 */
import type { RawRecord } from "./collectors";

/** A title that names an HR function. */
export const HR_TITLE =
  /\b(hr|hrbp|hris|hrms|human resources?|talent acquisition|talent partner|talent (lead|leader|manager|specialist|sourcer|advisor|head|director)|head of talent|recruit(er|ers|ing|ment)|sourcer|sourcing|people (ops|operations|partner|team|lead|head|manager|director|experience|programs?|analytics|business partner|and culture|& culture|generalist|specialist|coordinator|associate)|head of people|chief people|vp,? people|people & culture|culture (lead|manager|head|specialist)|employee (experience|relations|engagement)|l&d|learning (and|&) development|learning (partner|specialist|manager|lead)|training (manager|lead|specialist)|organi[sz]ational development|\bod\b|total rewards|compensation (and|&) benefits|c&b|benefits (manager|specialist|lead)|payroll|employer brand(ing)?|ta (lead|manager|partner|specialist|executive)|onboarding (specialist|coordinator)|dei|diversity)\b/i;

/** Functions that are not HR, even when the title borrows an HR word. */
export const NON_HR_TITLE =
  /\b(sales|account (executive|manager)|business development|bdr|sdr|customer (success|support|experience)|technical support|solutions? (engineer|architect|consultant)|engineer(ing)?|developer|devops|sre|architect|data scien|machine learning|product (manager|designer|owner)|designer|marketing|growth|revenue|commission|deal desk|finance|accountant|accounting|legal|counsel|software|it (support|admin)|security)\b/i;

/** Unmistakably HR — wins even when the title names the team hired for ("Engineering Recruiter", "HRBP – Sales"). */
const CORE_HR_TITLE =
  /\b(recruit(er|ers|ing|ment)|talent acquisition|sourcer|hrbp|hr business partner|people partner|human resources|hr|head of people|chief people|people (and|&) (culture|talent))\b/i;

/** The job itself is not HR, whatever team it serves ("Software Engineer, HR Tech"). */
const NOT_HR_JOB =
  /\b(engineer|developer|software|devops|sre|architect|data scientist|account executive|sales (manager|executive|representative|lead|director|associate))\b/i;

export function isHrTitle(title: string) {
  if (NOT_HR_JOB.test(title)) return false;
  return CORE_HR_TITLE.test(title) || (HR_TITLE.test(title) && !NON_HR_TITLE.test(title));
}

export const INDIA =
  /\b(india|indian|bengaluru|bangalore|mumbai|navi mumbai|thane|delhi|new delhi|ncr|gurugram|gurgaon|noida|hyderabad|pune|chennai|kolkata|ahmedabad|jaipur|kochi|cochin|chandigarh|indore|coimbatore|lucknow|bhubaneswar|vadodara|surat|mysuru|mysore|trivandrum|thiruvananthapuram|goa|karnataka|maharashtra|telangana|tamil nadu|haryana|uttar pradesh|gujarat|kerala|west bengal)\b/i;
const REMOTE = /\b(remote|anywhere|work from home|wfh|distributed)\b/i;
/** Remote, but only for somewhere other than India. */
const ELSEWHERE =
  /\b(us|u\.s\.|usa|united states|americas?|north america|canada|mexico|latam|brazil|uk|u\.k\.|united kingdom|england|london|ireland|europe|emea|eu|germany|france|spain|netherlands|poland|portugal|australia|new zealand|singapore|japan|philippines|est|pst|cst|california|new york|san francisco|bay area|seattle|austin|boston|chicago|denver|los angeles|atlanta|miami|washington|texas|massachusetts|illinois|colorado|florida|georgia|virginia|new jersey|toronto|vancouver|berlin|paris|amsterdam|dublin|sydney|melbourne|uae|u\.a\.e\.|dubai|abu dhabi|middle east|mena|gcc|saudi|riyadh|qatar|doha|bahrain|kuwait|oman|israel|turkey|egypt|africa|nigeria|kenya|china|hong kong|korea|taiwan|vietnam|indonesia|malaysia|thailand|sweden|norway|denmark|finland|switzerland|austria|belgium|italy|czech|romania|ukraine|argentina|chile|colombia|peru|[a-z]+, (ca|ny|wa|tx|ma|il|co|ga|fl|nj|va|dc|on|bc))\b/i;

/** India-based, or remote without a restriction to another region. */
export function isIndiaOrRemote(...texts: (string | undefined | null)[]) {
  const text = texts.filter(Boolean).join(" · ");
  if (!text) return false;
  if (INDIA.test(text)) return true;
  return REMOTE.test(text) && !ELSEWHERE.test(text);
}

export const MAX_AGE_DAYS = 60;

/** Posted within the last 60 days. No date → can't tell → kept. */
export function isFresh(postedAt?: Date | null, now = Date.now()) {
  if (!postedAt || Number.isNaN(postedAt.getTime())) return true;
  return now - postedAt.getTime() <= MAX_AGE_DAYS * 864e5;
}

/** Where a collected posting is, from what the source gave (before extraction). */
function knownLocation(record: RawRecord) {
  if (record.meta?.location !== undefined || record.meta?.remote) {
    return [record.meta?.location, record.meta?.remote ? "Remote" : undefined];
  }
  // HN posts put it on the first line: "Company | Role | Location | …".
  if (record.source === "hn") return [record.rawText.split("\n")[0]];
  return null;
}

/**
 * The cheap check before extraction: HR title, India or remote (when the
 * source says where), and fresh. HN titles are the post's first line.
 */
export function passesGate(record: RawRecord) {
  if (!isHrTitle(record.title ?? "")) return false;
  if (!isFresh(record.postedAt)) return false;
  const location = knownLocation(record);
  return location === null || isIndiaOrRemote(...location);
}
