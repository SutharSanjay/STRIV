import type { SqlExecutor } from '../../../database/migrate';
import { asNullableNumber, asNullableString, asNumber, asString } from '../../../database/rows';
import {
  buildDashboard,
  type Dashboard,
  type DashboardSession,
} from '../domain/dashboard';

function sessionStatus(value: string): DashboardSession['status'] | null {
  if (value === 'completed' || value === 'abandoned') {
    return value;
  }
  return null;
}

export async function loadDashboard(db: SqlExecutor, now: Date): Promise<Dashboard> {
  const sessions = await db.execute(
    `SELECT status, started_at, completed_at
     FROM workout_sessions
     WHERE status IN ('completed', 'abandoned')`,
  );
  const sets = await db.execute(
    `SELECT ws.completed_at, se.exercise_name, se.muscle_group_name,
            es.weight, es.reps
     FROM exercise_sets es
     JOIN session_exercises se ON se.id = es.session_exercise_id
     JOIN workout_sessions ws ON ws.id = se.session_id
     WHERE ws.status = 'completed'
       AND ws.completed_at IS NOT NULL
       AND es.completed_at IS NOT NULL`,
  );
  const records = await db.execute(
    `SELECT e.name AS exercise_name, pr.estimated_one_rep_max, pr.achieved_at
     FROM personal_records pr
     JOIN exercises e ON e.id = pr.exercise_id`,
  );
  const weights = await db.execute(
    `SELECT value, measured_at
     FROM body_measurements
     WHERE metric = 'body_weight'
     ORDER BY measured_at ASC`,
  );

  return buildDashboard({
    now,
    sessions: sessions.rows.flatMap(row => {
      const status = sessionStatus(asString(row.status));
      if (!status) {
        return [];
      }
      return [
        {
          status,
          startedAt: asString(row.started_at),
          completedAt: asNullableString(row.completed_at),
        },
      ];
    }),
    sets: sets.rows.map(row => ({
      completedAt: asString(row.completed_at),
      exerciseName: asString(row.exercise_name),
      muscleGroupName: asNullableString(row.muscle_group_name),
      weight: asNullableNumber(row.weight),
      reps: asNullableNumber(row.reps),
    })),
    records: records.rows.map(row => ({
      exerciseName: asString(row.exercise_name),
      estimatedOneRepMax: asNumber(row.estimated_one_rep_max),
      achievedAt: asString(row.achieved_at),
    })),
    weights: weights.rows.map(row => ({
      value: asNumber(row.value),
      measuredAt: asString(row.measured_at),
    })),
  });
}
