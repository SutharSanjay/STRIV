export type ScheduleDay = {
  id: string;
  name: string;
  position: number;
  weekday: number | null;
};

export function assertDaySchedule(
  days: readonly { id: string; weekday: number | null }[],
  dayId: string | null,
  weekday: number | null,
): string | null {
  const others = days.filter(day => day.id !== dayId);
  const usesWeekdays = others.some(day => day.weekday !== null);
  const rotates = others.some(day => day.weekday === null);
  if (weekday === null && usesWeekdays) {
    return 'Choose a weekday. This split is scheduled by day of the week.';
  }
  if (weekday !== null && rotates && !usesWeekdays) {
    return 'Leave this day on rotation so it stays in sequence with the others.';
  }
  if (weekday !== null && others.some(day => day.weekday === weekday)) {
    return 'That day of the week is already used.';
  }
  return null;
}

export function resolveTrainingDay(
  days: readonly ScheduleDay[],
  weekdayToday: number,
  lastCompletedDayId: string | null,
): ScheduleDay | null {
  if (days.length === 0 || weekdayToday < 0 || weekdayToday > 6) {
    return null;
  }

  const ordered = [...days].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  const usesWeekdays = ordered.some(day => day.weekday !== null);
  if (usesWeekdays) {
    return (
      ordered.find(day => day.weekday === weekdayToday) ?? null
    );
  }

  if (!lastCompletedDayId) {
    return ordered[0] ?? null;
  }
  const lastIndex = ordered.findIndex(day => day.id === lastCompletedDayId);
  if (lastIndex < 0) {
    return ordered[0] ?? null;
  }
  return ordered[(lastIndex + 1) % ordered.length] ?? null;
}
