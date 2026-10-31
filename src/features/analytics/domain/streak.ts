import {
  addLocalDays,
  localDateKey,
  localDayDistance,
  startOfLocalDay,
} from '../../../utils/time';

export type StreakInput = {
  completedAt: readonly string[];
  scheduledWeekdays: readonly number[] | null;
  rotationLength: number;
  now: Date;
};

function completedDays(completedAt: readonly string[]): Set<string> {
  return new Set(completedAt.map(iso => localDateKey(new Date(iso))));
}

function weekdayStreak(completed: Set<string>, weekdays: ReadonlySet<number>, now: Date): number {
  let streak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const day = addLocalDays(startOfLocalDay(now), -offset);
    const trained = completed.has(localDateKey(day));
    if (day.getDay() === 0 && !trained) {
      continue;
    }
    if (!weekdays.has(day.getDay())) {
      continue;
    }
    if (trained) {
      streak += 1;
      continue;
    }
    if (offset === 0) {
      continue;
    }
    break;
  }
  return streak;
}

/** Sundays between two training days are rest and do not widen the gap. */
function chargedGap(earlier: Date, later: Date): number {
  const distance = localDayDistance(earlier, later);
  let sundays = 0;
  for (let step = 1; step < distance; step += 1) {
    if (addLocalDays(startOfLocalDay(earlier), step).getDay() === 0) {
      sundays += 1;
    }
  }
  return distance - sundays;
}

function rotationStreak(completedAt: readonly string[], rotationLength: number, now: Date): number {
  const limit = Math.max(rotationLength, 1);
  const days = [...completedDays(completedAt)].sort((a, b) => b.localeCompare(a));
  const latest = days[0];
  if (!latest) {
    return 0;
  }
  const latestDate = new Date(`${latest}T12:00:00`);
  if (chargedGap(latestDate, now) > limit) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    const newer = days[index - 1];
    const older = days[index];
    if (!newer || !older) {
      break;
    }
    const gap = chargedGap(new Date(`${older}T12:00:00`), new Date(`${newer}T12:00:00`));
    if (gap > limit) {
      break;
    }
    streak += 1;
  }
  return streak;
}

/**
 * Counts finished training days, walking backward from today.
 * A scheduled rest day does not break the run. Sunday can be skipped without breaking it.
 * Today's session can still be open.
 */
export function sessionStreak(input: StreakInput): number {
  if (input.scheduledWeekdays && input.scheduledWeekdays.length > 0) {
    return weekdayStreak(completedDays(input.completedAt), new Set(input.scheduledWeekdays), input.now);
  }
  return rotationStreak(input.completedAt, input.rotationLength, input.now);
}

export function trainingMessage(input: {
  streak: number;
  todayFinished: boolean;
  recordsThisWeek: number;
}): string {
  const sessions = input.streak === 1 ? '1 session' : `${input.streak} sessions`;
  if (input.todayFinished && input.streak > 1) {
    return `${sessions} in a row. Today kept it.`;
  }
  if (input.todayFinished && input.streak === 1) {
    return 'Today is logged. One more session keeps it going.';
  }
  if (input.todayFinished) {
    return 'Today is logged.';
  }
  if (input.recordsThisWeek > 0 && input.streak > 0) {
    return `${sessions} in a row, and a record landed this week.`;
  }
  if (input.streak > 1) {
    return `${sessions} in a row. Finish the next one and it holds.`;
  }
  if (input.streak === 1) {
    return '1 session in a row. One more keeps it going.';
  }
  return 'Finish a session and the streak starts at one.';
}
