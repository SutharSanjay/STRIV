import type { SqlExecutor } from '../../../database/migrate';
import {
  asNullableNumber,
  asNullableString,
  asNumber,
  asString,
  firstRow,
} from '../../../database/rows';
import { createId } from '../../../utils/id';
import { TrainingError } from '../../training/errors';
import { validateName, validatePrescriptionNumbers } from '../../workouts/domain/validation';
import { assertDaySchedule } from '../domain/schedule';

export const ACTIVE_SPLIT_KEY = 'active_split_id';

export type SplitSummary = {
  id: string;
  name: string;
  dayNames: string[];
};

export type TemplateExerciseDetails = {
  id: string;
  exerciseId: string;
  name: string;
  position: number;
  targetSets: number;
  repMin: number;
  repMax: number;
  targetReps: number;
  currentWeight: number;
  increment: number;
};

export type SplitDayDetails = {
  id: string;
  name: string;
  position: number;
  weekday: number | null;
  exercises: TemplateExerciseDetails[];
};

export type SplitDetails = {
  id: string;
  name: string;
  days: SplitDayDetails[];
};

export type TemplateInput = {
  exerciseId: string;
  targetSets: number;
  repMin: number;
  repMax: number;
  weight: number;
  increment: number;
};

function mapTemplate(row: Readonly<Record<string, unknown>>): TemplateExerciseDetails {
  return {
    id: asString(row.id),
    exerciseId: asString(row.exercise_id),
    name: asString(row.exercise_name),
    position: asNumber(row.position),
    targetSets: asNumber(row.target_sets),
    repMin: asNumber(row.rep_min),
    repMax: asNumber(row.rep_max),
    targetReps: asNumber(row.target_reps),
    currentWeight: asNumber(row.current_weight),
    increment: asNumber(row.increment),
  };
}

async function assertEditable(db: SqlExecutor, splitId: string): Promise<void> {
  const result = await db.execute(
    'SELECT is_preset, archived_at FROM splits WHERE id = ?',
    [splitId],
  );
  const row = firstRow(result);
  if (!row) {
    throw new TrainingError('That split could not be found.');
  }
  if (asNumber(row.is_preset) === 1) {
    throw new TrainingError('Programs are copied into your splits before they can be edited.');
  }
  if (asNullableString(row.archived_at)) {
    throw new TrainingError('That split is archived.');
  }
}

async function nextPosition(
  db: SqlExecutor,
  table: 'split_days' | 'template_exercises',
  column: 'split_id' | 'split_day_id',
  parentId: string,
): Promise<number> {
  const result = await db.execute(
    `SELECT COALESCE(MAX(position), -1) AS total FROM ${table} WHERE ${column} = ?`,
    [parentId],
  );
  return asNumber(result.rows[0]?.total ?? -1) + 1;
}

export async function getActiveSplitId(db: SqlExecutor): Promise<string | null> {
  const result = await db.execute(
    'SELECT value FROM app_metadata WHERE key = ?',
    [ACTIVE_SPLIT_KEY],
  );
  const row = firstRow(result);
  return row ? asString(row.value) : null;
}

export async function setActiveSplit(db: SqlExecutor, splitId: string): Promise<void> {
  await assertEditable(db, splitId);
  await db.execute(
    `INSERT INTO app_metadata (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [ACTIVE_SPLIT_KEY, splitId],
  );
}

export async function listUserSplits(db: SqlExecutor): Promise<SplitSummary[]> {
  return listSplits(db, 0);
}

export async function listPrograms(db: SqlExecutor): Promise<SplitSummary[]> {
  return listSplits(db, 1);
}

async function listSplits(db: SqlExecutor, preset: number): Promise<SplitSummary[]> {
  const splits = await db.execute(
    `SELECT id, name FROM splits
     WHERE is_preset = ? AND archived_at IS NULL
     ORDER BY name COLLATE NOCASE`,
    [preset],
  );
  const days = await db.execute(
    `SELECT split_id, name FROM split_days ORDER BY position`,
  );
  return splits.rows.map(row => {
    const id = asString(row.id);
    return {
      id,
      name: asString(row.name),
      dayNames: days.rows
        .filter(day => asString(day.split_id) === id)
        .map(day => asString(day.name)),
    };
  });
}

export async function getSplit(db: SqlExecutor, splitId: string): Promise<SplitDetails | null> {
  const split = firstRow(
    await db.execute(
      'SELECT id, name FROM splits WHERE id = ? AND archived_at IS NULL',
      [splitId],
    ),
  );
  if (!split) {
    return null;
  }
  const days = await db.execute(
    `SELECT id, name, position, weekday FROM split_days
     WHERE split_id = ? ORDER BY position`,
    [splitId],
  );
  const exercises = await db.execute(
    `SELECT
       te.id, te.split_day_id, te.exercise_id, te.position, te.target_sets,
       te.rep_min, te.rep_max, te.target_reps, te.current_weight, te.increment,
       e.name AS exercise_name
     FROM template_exercises te
     JOIN exercises e ON e.id = te.exercise_id
     JOIN split_days sd ON sd.id = te.split_day_id
     WHERE sd.split_id = ? AND e.deleted_at IS NULL
     ORDER BY te.position`,
    [splitId],
  );

  return {
    id: asString(split.id),
    name: asString(split.name),
    days: days.rows.map(day => {
      const dayId = asString(day.id);
      return {
        id: dayId,
        name: asString(day.name),
        position: asNumber(day.position),
        weekday: asNullableNumber(day.weekday),
        exercises: exercises.rows
          .filter(row => asString(row.split_day_id) === dayId)
          .map(mapTemplate),
      };
    }),
  };
}

export async function createSplit(
  db: SqlExecutor,
  name: string,
  now: string,
): Promise<string> {
  const clean = validateName(name, 'Split name');
  const id = createId();
  await db.execute(
    `INSERT INTO splits (
      id, name, is_preset, source_preset_id, created_at, updated_at, archived_at
    ) VALUES (?, ?, 0, NULL, ?, ?, NULL)`,
    [id, clean, now, now],
  );
  if (!(await getActiveSplitId(db))) {
    await setActiveSplit(db, id);
  }
  return id;
}

export async function renameSplit(
  db: SqlExecutor,
  splitId: string,
  name: string,
  now: string,
): Promise<void> {
  await assertEditable(db, splitId);
  const clean = validateName(name, 'Split name');
  await db.execute('UPDATE splits SET name = ?, updated_at = ? WHERE id = ?', [
    clean,
    now,
    splitId,
  ]);
}

export async function archiveSplit(
  db: SqlExecutor,
  splitId: string,
  now: string,
): Promise<void> {
  await assertEditable(db, splitId);
  await db.transaction(async tx => {
    await tx.execute('UPDATE splits SET archived_at = ?, updated_at = ? WHERE id = ?', [
      now,
      now,
      splitId,
    ]);
    const active = await getActiveSplitId(tx);
    if (active === splitId) {
      await tx.execute('DELETE FROM app_metadata WHERE key = ?', [ACTIVE_SPLIT_KEY]);
    }
  });
}

export async function addDay(
  db: SqlExecutor,
  splitId: string,
  name: string,
  weekday: number | null,
  now: string,
): Promise<string> {
  await assertEditable(db, splitId);
  const clean = validateName(name, 'Day name');
  if (weekday !== null && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)) {
    throw new TrainingError('Choose a weekday or leave the day in rotation.');
  }
  const existingDays = await db.execute(
    'SELECT id, weekday FROM split_days WHERE split_id = ?',
    [splitId],
  );
  const scheduleError = assertDaySchedule(
    existingDays.rows.map(row => ({
      id: asString(row.id),
      weekday: asNullableNumber(row.weekday),
    })),
    null,
    weekday,
  );
  if (scheduleError) {
    throw new TrainingError(scheduleError);
  }
  const id = createId();
  const position = await nextPosition(db, 'split_days', 'split_id', splitId);
  await db.transaction(async tx => {
    await tx.execute(
      'INSERT INTO split_days (id, split_id, name, position, weekday) VALUES (?, ?, ?, ?, ?)',
      [id, splitId, clean, position, weekday],
    );
    await tx.execute('UPDATE splits SET updated_at = ? WHERE id = ?', [now, splitId]);
  });
  return id;
}

export async function updateDay(
  db: SqlExecutor,
  dayId: string,
  name: string,
  weekday: number | null,
  now: string,
): Promise<void> {
  const day = firstRow(
    await db.execute('SELECT split_id FROM split_days WHERE id = ?', [dayId]),
  );
  if (!day) {
    throw new TrainingError('That day could not be found.');
  }
  const splitId = asString(day.split_id);
  await assertEditable(db, splitId);
  const clean = validateName(name, 'Day name');
  if (weekday !== null && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)) {
    throw new TrainingError('Choose a weekday or leave the day in rotation.');
  }
  const existingDays = await db.execute(
    'SELECT id, weekday FROM split_days WHERE split_id = ?',
    [splitId],
  );
  const scheduleError = assertDaySchedule(
    existingDays.rows.map(row => ({
      id: asString(row.id),
      weekday: asNullableNumber(row.weekday),
    })),
    dayId,
    weekday,
  );
  if (scheduleError) {
    throw new TrainingError(scheduleError);
  }
  await db.transaction(async tx => {
    await tx.execute('UPDATE split_days SET name = ?, weekday = ? WHERE id = ?', [
      clean,
      weekday,
      dayId,
    ]);
    await tx.execute('UPDATE splits SET updated_at = ? WHERE id = ?', [now, splitId]);
  });
}

export async function removeDay(db: SqlExecutor, dayId: string, now: string): Promise<void> {
  const day = firstRow(
    await db.execute('SELECT split_id FROM split_days WHERE id = ?', [dayId]),
  );
  if (!day) {
    return;
  }
  const splitId = asString(day.split_id);
  await assertEditable(db, splitId);
  await db.transaction(async tx => {
    await tx.execute('DELETE FROM split_days WHERE id = ?', [dayId]);
    await tx.execute('UPDATE splits SET updated_at = ? WHERE id = ?', [now, splitId]);
  });
}

export async function addTemplateExercise(
  db: SqlExecutor,
  dayId: string,
  input: TemplateInput,
  now: string,
): Promise<string> {
  const day = firstRow(
    await db.execute('SELECT split_id FROM split_days WHERE id = ?', [dayId]),
  );
  if (!day) {
    throw new TrainingError('That day could not be found.');
  }
  const splitId = asString(day.split_id);
  await assertEditable(db, splitId);
  validatePrescriptionNumbers({
    targetSets: input.targetSets,
    repMin: input.repMin,
    repMax: input.repMax,
    weight: input.weight,
    increment: input.increment,
  });
  const exercise = firstRow(
    await db.execute(
      'SELECT id FROM exercises WHERE id = ? AND deleted_at IS NULL',
      [input.exerciseId],
    ),
  );
  if (!exercise) {
    throw new TrainingError('Choose an exercise from your library.');
  }
  const id = createId();
  const position = await nextPosition(db, 'template_exercises', 'split_day_id', dayId);
  await db.transaction(async tx => {
    await tx.execute(
      `INSERT INTO template_exercises (
        id, split_day_id, exercise_id, position, target_sets, rep_min, rep_max,
        target_reps, current_weight, increment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dayId,
        input.exerciseId,
        position,
        input.targetSets,
        input.repMin,
        input.repMax,
        input.repMin,
        input.weight,
        input.increment,
      ],
    );
    await tx.execute('UPDATE splits SET updated_at = ? WHERE id = ?', [now, splitId]);
  });
  return id;
}

export async function updateTemplateExercise(
  db: SqlExecutor,
  templateId: string,
  input: TemplateInput,
  now: string,
): Promise<void> {
  const current = firstRow(
    await db.execute(
      `SELECT te.target_reps, sd.split_id
       FROM template_exercises te
       JOIN split_days sd ON sd.id = te.split_day_id
       WHERE te.id = ?`,
      [templateId],
    ),
  );
  if (!current) {
    throw new TrainingError('That exercise could not be found on this day.');
  }
  const splitId = asString(current.split_id);
  await assertEditable(db, splitId);
  validatePrescriptionNumbers({
    targetSets: input.targetSets,
    repMin: input.repMin,
    repMax: input.repMax,
    weight: input.weight,
    increment: input.increment,
  });
  const previousReps = asNumber(current.target_reps);
  const targetReps =
    previousReps >= input.repMin && previousReps <= input.repMax
      ? previousReps
      : input.repMin;
  await db.transaction(async tx => {
    await tx.execute(
      `UPDATE template_exercises
       SET exercise_id = ?, target_sets = ?, rep_min = ?, rep_max = ?,
           target_reps = ?, current_weight = ?, increment = ?
       WHERE id = ?`,
      [
        input.exerciseId,
        input.targetSets,
        input.repMin,
        input.repMax,
        targetReps,
        input.weight,
        input.increment,
        templateId,
      ],
    );
    await tx.execute('UPDATE splits SET updated_at = ? WHERE id = ?', [now, splitId]);
  });
}

export async function removeTemplateExercise(
  db: SqlExecutor,
  templateId: string,
  now: string,
): Promise<void> {
  const current = firstRow(
    await db.execute(
      `SELECT sd.split_id
       FROM template_exercises te
       JOIN split_days sd ON sd.id = te.split_day_id
       WHERE te.id = ?`,
      [templateId],
    ),
  );
  if (!current) {
    return;
  }
  const splitId = asString(current.split_id);
  await assertEditable(db, splitId);
  await db.transaction(async tx => {
    await tx.execute('DELETE FROM template_exercises WHERE id = ?', [templateId]);
    await tx.execute('UPDATE splits SET updated_at = ? WHERE id = ?', [now, splitId]);
  });
}

export async function adoptProgram(
  db: SqlExecutor,
  presetId: string,
  now: string,
): Promise<string> {
  const preset = firstRow(
    await db.execute(
      'SELECT id, name, is_preset FROM splits WHERE id = ? AND archived_at IS NULL',
      [presetId],
    ),
  );
  if (!preset || asNumber(preset.is_preset) !== 1) {
    throw new TrainingError('That program could not be found.');
  }

  const source = await getSplit(db, presetId);
  if (!source) {
    throw new TrainingError('That program could not be found.');
  }

  const splitId = createId();
  await db.transaction(async tx => {
    await tx.execute(
      `INSERT INTO splits (
        id, name, is_preset, source_preset_id, created_at, updated_at, archived_at
      ) VALUES (?, ?, 0, ?, ?, ?, NULL)`,
      [splitId, asString(preset.name), presetId, now, now],
    );
    for (const day of source.days) {
      const dayId = createId();
      await tx.execute(
        'INSERT INTO split_days (id, split_id, name, position, weekday) VALUES (?, ?, ?, ?, ?)',
        [dayId, splitId, day.name, day.position, day.weekday],
      );
      for (const exercise of day.exercises) {
        await tx.execute(
          `INSERT INTO template_exercises (
            id, split_day_id, exercise_id, position, target_sets, rep_min, rep_max,
            target_reps, current_weight, increment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            createId(),
            dayId,
            exercise.exerciseId,
            exercise.position,
            exercise.targetSets,
            exercise.repMin,
            exercise.repMax,
            exercise.targetReps,
            exercise.currentWeight,
            exercise.increment,
          ],
        );
      }
    }
    await tx.execute(
      `INSERT INTO app_metadata (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [ACTIVE_SPLIT_KEY, splitId],
    );
  });
  return splitId;
}
