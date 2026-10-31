import type { SqlExecutor } from '../../../database/migrate';
import { asNullableNumber, asString } from '../../../database/rows';
import { getActiveSplitId } from '../../splits/data/splits';
import { localDateKey, startOfWeekIso } from '../../../utils/time';
import { sessionStreak, trainingMessage } from '../domain/streak';
import { weekStats } from './progress';

export type TrainingPulse = {
  streak: number;
  message: string;
};

export async function loadTrainingPulse(
  db: SqlExecutor,
  now: Date = new Date(),
): Promise<TrainingPulse> {
  const activeId = await getActiveSplitId(db);
  let scheduledWeekdays: number[] | null = null;
  let rotationLength = 1;

  if (activeId) {
    const days = await db.execute(
      'SELECT weekday FROM split_days WHERE split_id = ?',
      [activeId],
    );
    const weekdays = days.rows.flatMap(row => {
      const weekday = asNullableNumber(row.weekday);
      return weekday === null ? [] : [weekday];
    });
    if (weekdays.length > 0) {
      scheduledWeekdays = [...new Set(weekdays)];
    } else {
      rotationLength = Math.max(days.rows.length, 1);
    }
  }

  const sessions = await db.execute(
    `SELECT completed_at FROM workout_sessions
     WHERE status = 'completed' AND completed_at IS NOT NULL
     ORDER BY completed_at DESC
     LIMIT 400`,
  );
  const completedAt = sessions.rows.map(row => asString(row.completed_at));
  const streak = sessionStreak({
    completedAt,
    scheduledWeekdays,
    rotationLength,
    now,
  });
  const week = await weekStats(db, startOfWeekIso(now));
  const todayKey = localDateKey(now);
  const todayFinished = completedAt.some(iso => localDateKey(new Date(iso)) === todayKey);

  return {
    streak,
    message: trainingMessage({
      streak,
      todayFinished,
      recordsThisWeek: week.records,
    }),
  };
}
