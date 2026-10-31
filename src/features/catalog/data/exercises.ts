import type { SqlExecutor } from '../../../database/migrate';
import { asNullableString, asString, firstRow } from '../../../database/rows';
import { createId } from '../../../utils/id';
import { validateName } from '../../workouts/domain/validation';
import { TrainingError } from '../../training/errors';

export type NamedOption = {
  id: string;
  name: string;
};

export type ExerciseInput = {
  name: string;
  muscleGroupId: string | null;
  equipmentId: string | null;
};

export type ExerciseDetails = ExerciseInput & {
  id: string;
  muscleGroupName: string | null;
  equipmentName: string | null;
};

const EXERCISE_SELECT = `
  SELECT
    e.id,
    e.name,
    e.muscle_group_id,
    e.equipment_id,
    mg.name AS muscle_group_name,
    eq.name AS equipment_name
  FROM exercises e
  LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
  LEFT JOIN equipment eq ON eq.id = e.equipment_id
`;

function mapExercise(row: Readonly<Record<string, unknown>>): ExerciseDetails {
  return {
    id: asString(row.id),
    name: asString(row.name),
    muscleGroupId: asNullableString(row.muscle_group_id),
    equipmentId: asNullableString(row.equipment_id),
    muscleGroupName: asNullableString(row.muscle_group_name),
    equipmentName: asNullableString(row.equipment_name),
  };
}

async function assertUniqueName(
  db: SqlExecutor,
  name: string,
  exceptId?: string,
): Promise<void> {
  const existing = await db.execute(
    `SELECT id FROM exercises
     WHERE deleted_at IS NULL AND lower(name) = lower(?) AND id != ?
     LIMIT 1`,
    [name, exceptId ?? ''],
  );
  if (existing.rows.length > 0) {
    throw new TrainingError('An exercise with that name is already in your library.');
  }
}

async function assertOption(
  db: SqlExecutor,
  table: 'muscle_groups' | 'equipment',
  id: string | null,
  label: string,
): Promise<void> {
  if (!id) {
    return;
  }
  const row = await db.execute(`SELECT id FROM ${table} WHERE id = ?`, [id]);
  if (row.rows.length === 0) {
    throw new TrainingError(`Choose a ${label} from the list.`);
  }
}

export async function listMuscleGroups(db: SqlExecutor): Promise<NamedOption[]> {
  const result = await db.execute(
    'SELECT id, name FROM muscle_groups ORDER BY name COLLATE NOCASE',
  );
  return result.rows.map(row => ({ id: asString(row.id), name: asString(row.name) }));
}

export async function listEquipment(db: SqlExecutor): Promise<NamedOption[]> {
  const result = await db.execute(
    'SELECT id, name FROM equipment ORDER BY name COLLATE NOCASE',
  );
  return result.rows.map(row => ({ id: asString(row.id), name: asString(row.name) }));
}

export async function listExercises(db: SqlExecutor): Promise<ExerciseDetails[]> {
  const result = await db.execute(
    `${EXERCISE_SELECT} WHERE e.deleted_at IS NULL ORDER BY e.name COLLATE NOCASE`,
  );
  return result.rows.map(mapExercise);
}

export async function getExercise(
  db: SqlExecutor,
  id: string,
): Promise<ExerciseDetails | null> {
  const result = await db.execute(
    `${EXERCISE_SELECT} WHERE e.id = ? AND e.deleted_at IS NULL`,
    [id],
  );
  const row = firstRow(result);
  return row ? mapExercise(row) : null;
}

export async function createExercise(
  db: SqlExecutor,
  input: ExerciseInput,
  now: string,
): Promise<string> {
  const name = validateName(input.name, 'Exercise name');
  await assertUniqueName(db, name);
  await assertOption(db, 'muscle_groups', input.muscleGroupId, 'muscle group');
  await assertOption(db, 'equipment', input.equipmentId, 'equipment type');
  const id = createId();
  await db.execute(
    `INSERT INTO exercises (
      id, name, muscle_group_id, equipment_id, created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [id, name, input.muscleGroupId, input.equipmentId, now, now],
  );
  return id;
}

export async function updateExercise(
  db: SqlExecutor,
  id: string,
  input: ExerciseInput,
  now: string,
): Promise<void> {
  const current = await getExercise(db, id);
  if (!current) {
    throw new TrainingError('That exercise is no longer in your library.');
  }
  const name = validateName(input.name, 'Exercise name');
  await assertUniqueName(db, name, id);
  await assertOption(db, 'muscle_groups', input.muscleGroupId, 'muscle group');
  await assertOption(db, 'equipment', input.equipmentId, 'equipment type');
  await db.execute(
    `UPDATE exercises
     SET name = ?, muscle_group_id = ?, equipment_id = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [name, input.muscleGroupId, input.equipmentId, now, id],
  );
}

export async function archiveExercise(
  db: SqlExecutor,
  id: string,
  now: string,
): Promise<void> {
  const current = await getExercise(db, id);
  if (!current) {
    throw new TrainingError('That exercise is no longer in your library.');
  }
  await db.execute(
    'UPDATE exercises SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    [now, now, id],
  );
}
