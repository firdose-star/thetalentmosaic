/**
 * Date helpers for the sample dataset.
 *
 * Sample records are generated relative to a fixed "as of" date so they are
 * identical on the server and the client (no hydration drift) and every run.
 */
export const SAMPLE_AS_OF = new Date(2026, 9, 15);

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Local-calendar `YYYY-MM-DD`. */
export function isoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days from `asOf` to `value` — negative in the past. */
export function daysFrom(value: string, asOf: Date) {
  return Math.round((parseIsoDate(value).getTime() - asOf.getTime()) / 86_400_000);
}

/** Days until the next occurrence of a birthday, 0 when it is today. */
export function daysUntilBirthday(
  birthday: { month: number; day: number },
  asOf: Date,
) {
  let next = new Date(asOf.getFullYear(), birthday.month, birthday.day);
  if (next < asOf) next = new Date(asOf.getFullYear() + 1, birthday.month, birthday.day);
  return Math.round((next.getTime() - asOf.getTime()) / 86_400_000);
}
