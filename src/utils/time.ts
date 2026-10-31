const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

export function weekday(now: Date = new Date()): number {
  return now.getDay();
}

export function weekdayName(day: number): string {
  return WEEKDAY_NAMES[day] ?? 'Day';
}

export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Whole local midnights between two instants. Earlier then later is positive. */
export function localDayDistance(earlier: Date, later: Date): number {
  const start = startOfLocalDay(earlier).getTime();
  const end = startOfLocalDay(later).getTime();
  return Math.round((end - start) / 86_400_000);
}

/** Monday 00:00 in the device's local timezone, as a UTC timestamp. */
export function startOfWeekIso(now: Date): string {
  const local = new Date(now);
  const day = local.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  local.setHours(0, 0, 0, 0);
  local.setDate(local.getDate() - daysFromMonday);
  return local.toISOString();
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
