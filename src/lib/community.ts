/**
 * Community copy helpers shared by every slice that shows a member.
 */

const DAY = 86_400_000;

function parse(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "Member since 3 months" — PRD §6.2's live label, from the approval date. */
export function memberSince(joinedOn: string, asOf: Date = new Date()) {
  const joined = parse(joinedOn);
  const days = Math.floor((asOf.getTime() - joined.getTime()) / DAY);
  if (days < 1) return "Joined today";
  if (days < 30) return `Member since ${days} day${days > 1 ? "s" : ""}`;

  let months =
    (asOf.getFullYear() - joined.getFullYear()) * 12 +
    asOf.getMonth() -
    joined.getMonth();
  if (asOf.getDate() < joined.getDate()) months--;
  if (months < 12) return `Member since ${months} month${months > 1 ? "s" : ""}`;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  return `Member since ${years} year${years > 1 ? "s" : ""}${
    rest ? ` ${rest} month${rest > 1 ? "s" : ""}` : ""
  }`;
}

/** "15 Oct" / "15 Oct 2026" in the community's locale. */
export function shortDate(value: string, withYear = false) {
  return parse(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

/** Parse a sample/API `YYYY-MM-DD` as a local date. */
export function parseDay(value: string) {
  return parse(value);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
