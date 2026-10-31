import type { SqlExecutor } from '../../../database/migrate';
import {
  asNumber,
  asString,
  countOf,
  firstRow,
} from '../../../database/rows';
import { createId } from '../../../utils/id';
import { bestWeightBySession, type ChartPoint } from '../domain/series';
import { TrainingError } from '../../training/errors';
import { parseBodyWeight } from '../../workouts/domain/validation';

export type RecordEntry = {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
  achievedAt: string;
};

export type MeasurementEntry = {
  id: string;
  value: number;
  unit: string;
  measuredAt: string;
};

export type WeekStats = {
  workouts: number;
  completedSets: number;
  records: number;
};

export async function listPersonalRecords(db: SqlExecutor): Promise<RecordEntry[]> {
  const result = await db.execute(
    `SELECT pr.exercise_id, e.name AS exercise_name, pr.weight, pr.reps,
            pr.estimated_one_rep_max, pr.achieved_at
     FROM personal_records pr
     JOIN exercises e ON e.id = pr.exercise_id
     WHERE pr.achieved_at = (
       SELECT MAX(latest.achieved_at) FROM personal_records latest
       WHERE latest.exercise_id = pr.exercise_id
     )
     ORDER BY e.name COLLATE NOCASE`,
  );
  return result.rows.map(row => ({
    exerciseId: asString(row.exercise_id),
    exerciseName: asString(row.exercise_name),
    weight: asNumber(row.weight),
    reps: asNumber(row.reps),
    estimatedOneRepMax: asNumber(row.estimated_one_rep_max),
    achievedAt: asString(row.achieved_at),
  }));
}

export async function listMeasurements(db: SqlExecutor): Promise<MeasurementEntry[]> {
  const result = await db.execute(
    `SELECT id, value, unit, measured_at
     FROM body_measurements
     WHERE metric = 'body_weight'
     ORDER BY measured_at DESC
     LIMIT 30`,
  );
  return result.rows.map(row => ({
    id: asString(row.id),
    value: asNumber(row.value),
    unit: asString(row.unit),
    measuredAt: asString(row.measured_at),
  }));
}

export async function addBodyWeight(
  db: SqlExecutor,
  input: string,
  now: string,
): Promise<void> {
  const value = parseBodyWeight(input);
  if (value === null) {
    throw new TrainingError('Enter a body weight from 1 to 500 kg.');
  }
  await db.execute(
    `INSERT INTO body_measurements (id, metric, value, unit, measured_at)
     VALUES (?, 'body_weight', ?, 'kg', ?)`,
    [createId(), value, now],
  );
}

export async function weightSeries(
  db: SqlExecutor,
  exerciseId: string,
): Promise<ChartPoint[]> {
  const exercise = firstRow(
    await db.execute('SELECT id FROM exercises WHERE id = ?', [exerciseId]),
  );
  if (!exercise) {
    throw new TrainingError('That exercise could not be found.');
  }
  const result = await db.execute(
    `SELECT ws.id AS session_id, ws.completed_at, es.weight, es.reps, es.completed_at AS set_completed_at
     FROM exercise_sets es
     JOIN session_exercises se ON se.id = es.session_exercise_id
     JOIN workout_sessions ws ON ws.id = se.session_id
     WHERE se.exercise_id = ? AND ws.status = 'completed' AND ws.completed_at IS NOT NULL
     ORDER BY ws.completed_at`,
    [exerciseId],
  );
  return bestWeightBySession(
    result.rows.map(row => ({
      sessionId: asString(row.session_id),
      completedAt: asString(row.completed_at),
      weight: row.weight === null ? null : asNumber(row.weight),
      reps: row.reps === null ? null : asNumber(row.reps),
      setCompletedAt: row.set_completed_at === null ? null : asString(row.set_completed_at),
    })),
  );
}

export async function weekStats(db: SqlExecutor, weekStartIso: string): Promise<WeekStats> {
  const workouts = await db.execute(
    `SELECT COUNT(*) AS total FROM workout_sessions
     WHERE status = 'completed' AND completed_at >= ?`,
    [weekStartIso],
  );
  const sets = await db.execute(
    `SELECT COUNT(*) AS total
     FROM exercise_sets es
     JOIN session_exercises se ON se.id = es.session_exercise_id
     JOIN workout_sessions ws ON ws.id = se.session_id
     WHERE ws.status = 'completed' AND ws.completed_at >= ? AND es.completed_at IS NOT NULL`,
    [weekStartIso],
  );
  const records = await db.execute(
    'SELECT COUNT(*) AS total FROM personal_records WHERE achieved_at >= ?',
    [weekStartIso],
  );
  return {
    workouts: countOf(workouts),
    completedSets: countOf(sets),
    records: countOf(records),
  };
}
