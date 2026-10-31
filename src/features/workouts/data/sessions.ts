import type { SqlExecutor } from '../../../database/migrate';
import {
  asNullableNumber,
  asNullableString,
  asNumber,
  asString,
  countOf,
  firstRow,
} from '../../../database/rows';
import { createId } from '../../../utils/id';
import { formatWeight } from '../domain/format';
import { parseReps, parseWeight } from '../domain/validation';
import {
  countCompletedSets,
  planCompletion,
  type CompletionExercise,
} from '../domain/completion';
import { resolveTrainingDay, type ScheduleDay } from '../../splits/domain/schedule';
import { getActiveSplitId } from '../../splits/data/splits';
import { TrainingError } from '../../training/errors';

export type TodayExercise = {
  templateExerciseId: string;
  name: string;
  muscle: string | null;
  sets: number;
  repMin: number;
  repMax: number;
  weight: number;
  reps: number;
};

export type TodayDayChoice = {
  id: string;
  name: string;
};

export type TodayView = {
  inProgressSessionId: string | null;
  activeSplit: { id: string; name: string } | null;
  day: { id: string; name: string; exercises: TodayExercise[] } | null;
  days: TodayDayChoice[];
};

export type SessionSet = {
  id: string;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  completedAt: string | null;
};

export type SessionExerciseView = {
  id: string;
  name: string;
  muscle: string | null;
  targetSets: number;
  repMin: number;
  repMax: number;
  prescribedWeight: number;
  prescribedReps: number;
  increment: number;
  reason: string;
  sets: SessionSet[];
};

export type SessionView = {
  id: string;
  status: string;
  splitName: string;
  dayName: string;
  startedAt: string;
  completedAt: string | null;
  exercises: SessionExerciseView[];
};

export type HistoryEntry = {
  id: string;
  splitName: string;
  dayName: string;
  completedAt: string;
};

function startingReason(
  weight: number,
  reps: number,
  repMin: number,
  repMax: number,
  sets: number,
): string {
  return `Today: ${formatWeight(weight)} kg for ${reps} reps, across ${sets} sets in a ${repMin}–${repMax} range.`;
}

async function inProgressId(db: SqlExecutor): Promise<string | null> {
  const row = firstRow(
    await db.execute(
      `SELECT id FROM workout_sessions WHERE status = 'in_progress' ORDER BY started_at LIMIT 1`,
    ),
  );
  return row ? asString(row.id) : null;
}

export async function loadToday(db: SqlExecutor, weekdayToday: number): Promise<TodayView> {
  const inProgressSessionId = await inProgressId(db);
  const activeId = await getActiveSplitId(db);
  if (!activeId) {
    return { inProgressSessionId, activeSplit: null, day: null, days: [] };
  }

  const split = firstRow(
    await db.execute(
      'SELECT id, name, is_preset, archived_at FROM splits WHERE id = ?',
      [activeId],
    ),
  );
  if (!split || asNumber(split.is_preset) === 1 || asNullableString(split.archived_at)) {
    return { inProgressSessionId, activeSplit: null, day: null, days: [] };
  }

  const dayRows = await db.execute(
    'SELECT id, name, position, weekday FROM split_days WHERE split_id = ? ORDER BY position',
    [activeId],
  );
  const days: ScheduleDay[] = dayRows.rows.map(row => ({
    id: asString(row.id),
    name: asString(row.name),
    position: asNumber(row.position),
    weekday: asNullableNumber(row.weekday),
  }));
  const last = firstRow(
    await db.execute(
      `SELECT split_day_id FROM workout_sessions
       WHERE split_id = ? AND status = 'completed' AND split_day_id IS NOT NULL
       ORDER BY completed_at DESC LIMIT 1`,
      [activeId],
    ),
  );
  const choices = days.map(day => ({ id: day.id, name: day.name }));
  const resolved = resolveTrainingDay(
    days,
    weekdayToday,
    last ? asNullableString(last.split_day_id) : null,
  );
  if (!resolved) {
    return {
      inProgressSessionId,
      activeSplit: { id: activeId, name: asString(split.name) },
      day: null,
      days: choices,
    };
  }

  const exercises = await db.execute(
    `SELECT
       te.id, te.target_sets, te.rep_min, te.rep_max, te.target_reps, te.current_weight,
       e.name AS exercise_name, mg.name AS muscle_name
     FROM template_exercises te
     JOIN exercises e ON e.id = te.exercise_id
     LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
     WHERE te.split_day_id = ? AND e.deleted_at IS NULL
     ORDER BY te.position`,
    [resolved.id],
  );

  return {
    inProgressSessionId,
    activeSplit: { id: activeId, name: asString(split.name) },
    days: choices,
    day: {
      id: resolved.id,
      name: resolved.name,
      exercises: exercises.rows.map(row => ({
        templateExerciseId: asString(row.id),
        name: asString(row.exercise_name),
        muscle: asNullableString(row.muscle_name),
        sets: asNumber(row.target_sets),
        repMin: asNumber(row.rep_min),
        repMax: asNumber(row.rep_max),
        weight: asNumber(row.current_weight),
        reps: asNumber(row.target_reps),
      })),
    },
  };
}

export async function startSession(
  db: SqlExecutor,
  splitDayId: string,
  now: string,
): Promise<string> {
  return db.transaction(async tx => {
    const existing = await inProgressId(tx);
    if (existing) {
      return existing;
    }

    const day = firstRow(
      await tx.execute(
        `SELECT sd.id, sd.name AS day_name, s.id AS split_id, s.name AS split_name, s.is_preset, s.archived_at
         FROM split_days sd
         JOIN splits s ON s.id = sd.split_id
         WHERE sd.id = ?`,
        [splitDayId],
      ),
    );
    if (!day || asNumber(day.is_preset) === 1 || asNullableString(day.archived_at)) {
      throw new TrainingError('Choose one of your splits before starting.');
    }

    const templates = await tx.execute(
      `SELECT
         te.id, te.position, te.target_sets, te.rep_min, te.rep_max, te.target_reps,
         te.current_weight, te.increment, te.exercise_id,
         e.name AS exercise_name, mg.name AS muscle_name, eq.name AS equipment_name
       FROM template_exercises te
       JOIN exercises e ON e.id = te.exercise_id
       LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
       LEFT JOIN equipment eq ON eq.id = e.equipment_id
       WHERE te.split_day_id = ? AND e.deleted_at IS NULL
       ORDER BY te.position`,
      [splitDayId],
    );
    if (templates.rows.length === 0) {
      throw new TrainingError('Add an exercise to this day before starting.');
    }

    const sessionId = createId();
    await tx.execute(
      `INSERT INTO workout_sessions (
        id, status, split_id, split_name, split_day_id, split_day_name, started_at, completed_at, updated_at
      ) VALUES (?, 'in_progress', ?, ?, ?, ?, ?, NULL, ?)`,
      [
        sessionId,
        asString(day.split_id),
        asString(day.split_name),
        asString(day.id),
        asString(day.day_name),
        now,
        now,
      ],
    );

    for (const row of templates.rows) {
      const sessionExerciseId = createId();
      const targetSets = asNumber(row.target_sets);
      const repMin = asNumber(row.rep_min);
      const repMax = asNumber(row.rep_max);
      const weight = asNumber(row.current_weight);
      const reps = asNumber(row.target_reps);
      await tx.execute(
        `INSERT INTO session_exercises (
          id, session_id, position, exercise_id, exercise_name, muscle_group_name, equipment_name,
          target_sets, rep_min, rep_max, prescribed_weight, prescribed_reps, increment,
          template_exercise_id, recommendation_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionExerciseId,
          sessionId,
          asNumber(row.position),
          asString(row.exercise_id),
          asString(row.exercise_name),
          asNullableString(row.muscle_name),
          asNullableString(row.equipment_name),
          targetSets,
          repMin,
          repMax,
          weight,
          reps,
          asNumber(row.increment),
          asString(row.id),
          startingReason(weight, reps, repMin, repMax, targetSets),
        ],
      );
      for (let index = 0; index < targetSets; index += 1) {
        await tx.execute(
          `INSERT INTO exercise_sets (id, session_exercise_id, set_index, weight, reps, completed_at)
           VALUES (?, ?, ?, NULL, NULL, NULL)`,
          [createId(), sessionExerciseId, index],
        );
      }
    }

    return sessionId;
  });
}

function mapSet(row: Readonly<Record<string, unknown>>): SessionSet {
  return {
    id: asString(row.id),
    setIndex: asNumber(row.set_index),
    weight: asNullableNumber(row.weight),
    reps: asNullableNumber(row.reps),
    completedAt: asNullableString(row.completed_at),
  };
}

export async function loadSession(db: SqlExecutor, sessionId: string): Promise<SessionView | null> {
  const session = firstRow(
    await db.execute(
      `SELECT id, status, split_name, split_day_name, started_at, completed_at
       FROM workout_sessions WHERE id = ?`,
      [sessionId],
    ),
  );
  if (!session) {
    return null;
  }
  const exercises = await db.execute(
    `SELECT
       id, position, exercise_name, muscle_group_name, target_sets, rep_min, rep_max,
       prescribed_weight, prescribed_reps, increment, recommendation_reason
     FROM session_exercises
     WHERE session_id = ?
     ORDER BY position`,
    [sessionId],
  );
  const sets = await db.execute(
    `SELECT es.id, es.session_exercise_id, es.set_index, es.weight, es.reps, es.completed_at
     FROM exercise_sets es
     JOIN session_exercises se ON se.id = es.session_exercise_id
     WHERE se.session_id = ?
     ORDER BY es.set_index`,
    [sessionId],
  );

  return {
    id: asString(session.id),
    status: asString(session.status),
    splitName: asString(session.split_name),
    dayName: asString(session.split_day_name),
    startedAt: asString(session.started_at),
    completedAt: asNullableString(session.completed_at),
    exercises: exercises.rows.map(row => {
      const id = asString(row.id);
      return {
        id,
        name: asString(row.exercise_name),
        muscle: asNullableString(row.muscle_group_name),
        targetSets: asNumber(row.target_sets),
        repMin: asNumber(row.rep_min),
        repMax: asNumber(row.rep_max),
        prescribedWeight: asNumber(row.prescribed_weight),
        prescribedReps: asNumber(row.prescribed_reps),
        increment: asNumber(row.increment),
        reason: asString(row.recommendation_reason),
        sets: sets.rows.filter(set => asString(set.session_exercise_id) === id).map(mapSet),
      };
    }),
  };
}

function assertLogged(weight: number | null, reps: number | null, required: boolean): void {
  const weightOk = weight !== null && parseWeight(formatWeight(weight)) !== null;
  const repsOk = reps !== null && parseReps(String(reps)) !== null;
  if (required && (!weightOk || !repsOk)) {
    throw new TrainingError('Enter a weight from 0 to 500 kg and reps from 1 to 50.');
  }
  if ((weight !== null && !weightOk) || (reps !== null && !repsOk)) {
    throw new TrainingError('Enter a weight from 0 to 500 kg and reps from 1 to 50.');
  }
}

async function mutableSet(db: SqlExecutor, setId: string): Promise<void> {
  const row = firstRow(
    await db.execute(
      `SELECT ws.status AS status, es.completed_at AS completed_at
       FROM exercise_sets es
       JOIN session_exercises se ON se.id = es.session_exercise_id
       JOIN workout_sessions ws ON ws.id = se.session_id
       WHERE es.id = ?`,
      [setId],
    ),
  );
  if (!row || asString(row.status) !== 'in_progress') {
    throw new TrainingError('This workout is no longer open.');
  }
  if (asNullableString(row.completed_at)) {
    throw new TrainingError('Undo the set before changing it.');
  }
}

export async function saveSetDraft(
  db: SqlExecutor,
  setId: string,
  weight: number | null,
  reps: number | null,
): Promise<void> {
  assertLogged(weight, reps, false);
  await mutableSet(db, setId);
  await db.execute(
    'UPDATE exercise_sets SET weight = ?, reps = ? WHERE id = ? AND completed_at IS NULL',
    [weight, reps, setId],
  );
}

export async function completeSet(
  db: SqlExecutor,
  setId: string,
  weight: number,
  reps: number,
  now: string,
): Promise<void> {
  assertLogged(weight, reps, true);
  await mutableSet(db, setId);
  await db.execute(
    `UPDATE exercise_sets
     SET weight = ?, reps = ?, completed_at = ?
     WHERE id = ? AND completed_at IS NULL`,
    [weight, reps, now, setId],
  );
  const saved = firstRow(
    await db.execute('SELECT completed_at FROM exercise_sets WHERE id = ?', [setId]),
  );
  if (!saved || !asNullableString(saved.completed_at)) {
    throw new TrainingError('That set could not be completed.');
  }
}

export async function undoSet(db: SqlExecutor, setId: string): Promise<void> {
  const row = firstRow(
    await db.execute(
      `SELECT ws.status AS status
       FROM exercise_sets es
       JOIN session_exercises se ON se.id = es.session_exercise_id
       JOIN workout_sessions ws ON ws.id = se.session_id
       WHERE es.id = ?`,
      [setId],
    ),
  );
  if (!row || asString(row.status) !== 'in_progress') {
    throw new TrainingError('This workout is no longer open.');
  }
  await db.execute('UPDATE exercise_sets SET completed_at = NULL WHERE id = ?', [setId]);
}

async function completionExercises(
  db: SqlExecutor,
  sessionId: string,
): Promise<CompletionExercise[]> {
  const exercises = await db.execute(
    `SELECT
       se.id, se.exercise_id, se.template_exercise_id, se.rep_min, se.rep_max,
       se.target_sets, se.prescribed_weight, se.increment,
       (
         SELECT MAX(estimated_one_rep_max) FROM personal_records
         WHERE exercise_id = se.exercise_id
       ) AS previous_best
     FROM session_exercises se
     WHERE se.session_id = ?
     ORDER BY se.position`,
    [sessionId],
  );
  const sets = await db.execute(
    `SELECT es.id, es.session_exercise_id, es.weight, es.reps, es.completed_at
     FROM exercise_sets es
     JOIN session_exercises se ON se.id = es.session_exercise_id
     WHERE se.session_id = ?`,
    [sessionId],
  );

  return exercises.rows.map(row => {
    const id = asString(row.id);
    return {
      exerciseId: asNullableString(row.exercise_id),
      templateExerciseId: asNullableString(row.template_exercise_id),
      repMin: asNumber(row.rep_min),
      repMax: asNumber(row.rep_max),
      targetSets: asNumber(row.target_sets),
      prescribedWeight: asNumber(row.prescribed_weight),
      increment: asNumber(row.increment),
      previousBestE1rm: asNullableNumber(row.previous_best),
      sets: sets.rows
        .filter(set => asString(set.session_exercise_id) === id)
        .map(set => ({
          id: asString(set.id),
          weight: asNullableNumber(set.weight),
          reps: asNullableNumber(set.reps),
          completedAt: asNullableString(set.completed_at),
        })),
    };
  });
}

export async function finishSession(
  db: SqlExecutor,
  sessionId: string,
  now: string,
): Promise<void> {
  await db.transaction(async tx => {
    const current = firstRow(
      await tx.execute('SELECT status FROM workout_sessions WHERE id = ?', [sessionId]),
    );
    if (!current) {
      throw new TrainingError('That workout could not be found.');
    }
    if (asString(current.status) !== 'in_progress') {
      throw new TrainingError('This workout is already finished.');
    }

    const exercises = await completionExercises(tx, sessionId);
    if (countCompletedSets(exercises) < 1) {
      throw new TrainingError('Log at least one completed set before finishing.');
    }
    const plan = planCompletion(exercises);

    await tx.execute(
      `UPDATE workout_sessions
       SET status = 'completed', completed_at = ?, updated_at = ?
       WHERE id = ? AND status = 'in_progress'`,
      [now, now, sessionId],
    );
    const confirmed = firstRow(
      await tx.execute('SELECT status FROM workout_sessions WHERE id = ?', [sessionId]),
    );
    if (!confirmed || asString(confirmed.status) !== 'completed') {
      throw new TrainingError('This workout could not be saved.');
    }

    for (const update of plan.templateUpdates) {
      await tx.execute(
        'UPDATE template_exercises SET current_weight = ?, target_reps = ? WHERE id = ?',
        [update.currentWeight, update.targetReps, update.templateExerciseId],
      );
    }
    for (const record of plan.personalRecords) {
      await tx.execute(
        `INSERT INTO personal_records (
          id, exercise_id, weight, reps, estimated_one_rep_max, achieved_at, session_id, set_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createId(),
          record.exerciseId,
          record.weight,
          record.reps,
          record.estimatedOneRepMax,
          now,
          sessionId,
          record.setId,
        ],
      );
    }
  });
}

export async function abandonSession(
  db: SqlExecutor,
  sessionId: string,
  now: string,
): Promise<void> {
  await db.transaction(async tx => {
    const current = firstRow(
      await tx.execute('SELECT status FROM workout_sessions WHERE id = ?', [sessionId]),
    );
    if (!current) {
      throw new TrainingError('That workout could not be found.');
    }
    if (asString(current.status) !== 'in_progress') {
      throw new TrainingError('This workout is already finished.');
    }
    await tx.execute(
      `UPDATE workout_sessions
       SET status = 'abandoned', updated_at = ?
       WHERE id = ? AND status = 'in_progress'`,
      [now, sessionId],
    );
  });
}

export async function listHistory(db: SqlExecutor): Promise<HistoryEntry[]> {
  const result = await db.execute(
    `SELECT id, split_name, split_day_name, completed_at
     FROM workout_sessions
     WHERE status = 'completed' AND completed_at IS NOT NULL
     ORDER BY completed_at DESC
     LIMIT 100`,
  );
  return result.rows.map(row => ({
    id: asString(row.id),
    splitName: asString(row.split_name),
    dayName: asString(row.split_day_name),
    completedAt: asString(row.completed_at),
  }));
}

export async function completedSetCount(db: SqlExecutor, sessionId: string): Promise<number> {
  const result = await db.execute(
    `SELECT COUNT(*) AS total
     FROM exercise_sets es
     JOIN session_exercises se ON se.id = es.session_exercise_id
     WHERE se.session_id = ? AND es.completed_at IS NOT NULL`,
    [sessionId],
  );
  return countOf(result);
}
