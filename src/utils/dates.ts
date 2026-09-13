/**
 * Every date is normalised to UTC midnight before any night arithmetic,
 * so a stay cannot gain or lose a night across a DST boundary.
 */

export const MS_PER_DAY = 86_400_000;

export function toUTCDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function todayUTC(): Date {
  return toUTCDay(new Date());
}

export function nightsBetween(checkIn: Date | string, checkOut: Date | string): number {
  const a = toUTCDay(checkIn).getTime();
  const b = toUTCDay(checkOut).getTime();
  return Math.max(0, Math.round((b - a) / MS_PER_DAY));
}

export function addDays(date: Date | string, days: number): Date {
  return new Date(toUTCDay(date).getTime() + days * MS_PER_DAY);
}

/** yyyy-mm-dd for <input type="date"> without timezone slippage. */
export function toDateInput(date: Date | string): string {
  return toUTCDay(date).toISOString().slice(0, 10);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(d);
}
