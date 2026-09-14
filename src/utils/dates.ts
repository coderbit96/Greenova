/**
 * A reservation date is a calendar day at the hotel, not a moment in the
 * visitor's browser timezone. We store that day at UTC midnight after first
 * resolving it in the hotel's timezone, which keeps interval comparisons and
 * night arithmetic stable across daylight-saving changes.
 */

export const MS_PER_DAY = 86_400_000;
export const HOTEL_TIME_ZONE = process.env.HOTEL_TIMEZONE ?? "Asia/Kolkata";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function utcCalendarDay(year: number, month: number, day: number): Date | null {
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day
    ? value
    : null;
}

function hotelCalendarParts(date: Date): { year: number; month: number; day: number } | null {
  if (Number.isNaN(date.getTime())) return null;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: HOTEL_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
    return { year: part("year"), month: part("month"), day: part("day") };
  } catch {
    // A bad deployment timezone must not turn an invalid booking request into
    // an arbitrary date. Fall back to UTC only for a valid Date object.
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }
}

/**
 * Parses a permitted booking date without JavaScript's permissive date
 * rollover (for example, 2026-02-30). Plain yyyy-mm-dd input is treated as a
 * hotel-local calendar day; ISO timestamps are converted to their hotel day
 * for trusted internal callers and legacy API clients.
 */
export function toHotelDay(date: Date | string): Date | null {
  if (typeof date === "string") {
    const match = DATE_ONLY.exec(date);
    if (match) return utcCalendarDay(Number(match[1]), Number(match[2]), Number(match[3]));

    // Only accept complete ISO instants here. Loose strings such as
    // "10 October" and timezone-less timestamps are locale-dependent and
    // must be rejected. Validate the ISO calendar prefix before Date parses
    // it too, so 2026-02-30 cannot silently roll into March.
    const iso = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})$/.exec(date);
    if (!iso || !utcCalendarDay(Number(iso[1]), Number(iso[2]), Number(iso[3]))) return null;
    const parsed = new Date(date);
    const parts = hotelCalendarParts(parsed);
    return parts ? utcCalendarDay(parts.year, parts.month, parts.day) : null;
  }

  const parts = hotelCalendarParts(date);
  return parts ? utcCalendarDay(parts.year, parts.month, parts.day) : null;
}

export function isValidHotelDate(date: unknown): date is string {
  return typeof date === "string" && toHotelDay(date) !== null;
}

export function toUTCDay(date: Date | string): Date {
  return toHotelDay(date) ?? new Date(Number.NaN);
}

export function todayUTC(): Date {
  return toHotelDay(new Date())!;
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
