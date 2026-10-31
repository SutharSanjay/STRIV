import type { SqlExecutor } from '../../../database/migrate';
import { EQUIPMENT, EXERCISES, MUSCLES, PROGRAMS } from './library';

const CREATED_AT = '2026-01-01T00:00:00.000Z';

export const builtInExerciseCount = EXERCISES.length;
export const builtInProgramCount = PROGRAMS.length;

async function insertCatalog(db: SqlExecutor): Promise<void> {
  for (const [id, name] of MUSCLES) {
    await db.execute(
      'INSERT OR IGNORE INTO muscle_groups (id, name, created_at) VALUES (?, ?, ?)',
      [id, name, CREATED_AT],
    );
  }
  for (const [id, name] of EQUIPMENT) {
    await db.execute(
      'INSERT OR IGNORE INTO equipment (id, name, created_at) VALUES (?, ?, ?)',
      [id, name, CREATED_AT],
    );
  }
  for (const [id, name, muscleId, equipmentId] of EXERCISES) {
    await db.execute(
      `INSERT OR IGNORE INTO exercises (
        id, name, muscle_group_id, equipment_id, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [id, name, muscleId, equipmentId, CREATED_AT, CREATED_AT],
    );
  }
}

async function insertPrograms(db: SqlExecutor): Promise<void> {
  for (const program of PROGRAMS) {
    const existing = await db.execute('SELECT id FROM splits WHERE id = ?', [program.id]);
    if (existing.rows.length > 0) {
      continue;
    }
    await db.execute(
      `INSERT INTO splits (
        id, name, is_preset, source_preset_id, created_at, updated_at, archived_at
      ) VALUES (?, ?, 1, NULL, ?, ?, NULL)`,
      [program.id, program.name, CREATED_AT, CREATED_AT],
    );
    for (const [dayIndex, day] of program.days.entries()) {
      await db.execute(
        `INSERT INTO split_days (id, split_id, name, position, weekday)
         VALUES (?, ?, ?, ?, ?)`,
        [day.id, program.id, day.name, dayIndex, day.weekday],
      );
      for (const [slotIndex, item] of day.slots.entries()) {
        await db.execute(
          `INSERT INTO template_exercises (
            id, split_day_id, exercise_id, position, target_sets, rep_min, rep_max,
            target_reps, current_weight, increment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `${day.id}-${item.exerciseId}`,
            day.id,
            item.exerciseId,
            slotIndex,
            item.sets,
            item.repMin,
            item.repMax,
            item.repMin,
            item.weight,
            item.increment,
          ],
        );
      }
    }
  }
}

/** Adds built-in rows that are not already stored. Existing rows are left unchanged. */
export async function seedIfEmpty(db: SqlExecutor): Promise<void> {
  await db.transaction(async tx => {
    await insertCatalog(tx);
    await insertPrograms(tx);
  });
}
