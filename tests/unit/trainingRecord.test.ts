import { DatabaseSync } from 'node:sqlite';

import { addBodyWeight, listPersonalRecords, weekStats, weightSeries } from '../../src/features/analytics/data/progress';
import { archiveExercise, createExercise, listExercises } from '../../src/features/catalog/data/exercises';
import { builtInExerciseCount, builtInProgramCount, seedIfEmpty } from '../../src/features/catalog/data/seed';
import { adoptProgram, listPrograms, listUserSplits, renameSplit } from '../../src/features/splits/data/splits';
import { TrainingError } from '../../src/features/training/errors';
import {
  abandonSession,
  completeSet,
  finishSession,
  loadSession,
  loadToday,
  saveSetDraft,
  startSession,
  undoSet,
} from '../../src/features/workouts/data/sessions';
import { applyMigrations, type SqlExecutor, type SqlValue, type StatementResult } from '../../src/database/migrate';
import bundled from '../../src/database/migrations/migrations';

function createExecutor(): SqlExecutor & { close: () => void } {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  const execute = async (
    sql: string,
    params?: readonly SqlValue[],
  ): Promise<StatementResult> => {
    const statement = db.prepare(sql);
    const values = params ? [...params] : [];
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return { rows: statement.all(...values) };
    }
    statement.run(...values);
    return { rows: [] };
  };

  return {
    execute,
    transaction: async work => {
      db.exec('BEGIN');
      try {
        const result = await work({
          execute,
          transaction: () => {
            throw new Error('Nested database transactions are not supported');
          },
        });
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => db.close(),
  };
}

async function ready(): Promise<SqlExecutor & { close: () => void }> {
  const db = createExecutor();
  await applyMigrations(db, bundled);
  await seedIfEmpty(db);
  return db;
}

describe('training record', () => {
  it('seeds programs once and keeps history accurate after a workout is finished', async () => {
    const db = await ready();
    await seedIfEmpty(db);

    expect(await listPrograms(db)).toHaveLength(builtInProgramCount);
    expect(await listUserSplits(db)).toHaveLength(0);
    expect(await listExercises(db)).toHaveLength(builtInExerciseCount);

    const programs = await listPrograms(db);
    const fullBody = programs.find(program => program.name === 'Full Body');
    if (!fullBody) {
      throw new Error('Expected the Full Body program');
    }
    await expect(renameSplit(db, fullBody.id, 'Changed', '2026-10-26T00:00:00.000Z')).rejects.toThrow(
      TrainingError,
    );

    const splitId = await adoptProgram(db, fullBody.id, '2026-10-26T00:00:00.000Z');
    const monday = await loadToday(db, 1);
    const tuesday = await loadToday(db, 2);
    expect(monday.activeSplit?.id).toBe(splitId);
    expect(monday.day?.name).toBe('Full Body A');
    expect(tuesday.day).toBeNull();
    const squat = monday.day?.exercises.find(exercise => exercise.name === 'Back Squat');
    if (!monday.day || !squat) {
      throw new Error('Expected Back Squat on Full Body A');
    }

    const sessionId = await startSession(db, monday.day.id, '2026-10-26T01:00:00.000Z');
    expect(await startSession(db, monday.day.id, '2026-10-26T01:05:00.000Z')).toBe(sessionId);

    const opened = await loadSession(db, sessionId);
    const squatLog = opened?.exercises.find(exercise => exercise.name === 'Back Squat');
    if (!squatLog) {
      throw new Error('Expected the squat snapshot');
    }
    const firstSet = squatLog.sets[0];
    if (!firstSet) {
      throw new Error('Expected a working set');
    }
    await saveSetDraft(db, firstSet.id, 20, 8);
    const reopened = await loadSession(db, sessionId);
    expect(reopened?.exercises[0]?.sets[0]).toMatchObject({ weight: 20, reps: 8, completedAt: null });

    for (const set of squatLog.sets) {
      await completeSet(db, set.id, 20, 8, '2026-10-26T01:10:00.000Z');
    }
    await undoSet(db, firstSet.id);
    const undone = await loadSession(db, sessionId);
    expect(undone?.exercises[0]?.sets[0]?.completedAt).toBeNull();
    expect(undone?.exercises[0]?.sets[0]?.weight).toBe(20);
    await completeSet(db, firstSet.id, 20, 8, '2026-10-26T01:12:00.000Z');

    await finishSession(db, sessionId, '2026-10-26T01:20:00.000Z');

    const saved = await loadSession(db, sessionId);
    expect(saved?.status).toBe('completed');
    expect(saved?.exercises[0]?.prescribedWeight).toBe(20);
    expect(saved?.exercises[0]?.name).toBe('Back Squat');

    const nextMonday = await loadToday(db, 1);
    const nextSquat = nextMonday.day?.exercises.find(exercise => exercise.name === 'Back Squat');
    expect(nextSquat).toMatchObject({ weight: 22.5, reps: 5 });

    const records = await listPersonalRecords(db);
    expect(records.some(record => record.exerciseName === 'Back Squat' && record.weight === 20)).toBe(
      true,
    );

    const library = await listExercises(db);
    const squatExercise = library.find(exercise => exercise.name === 'Back Squat');
    if (!squatExercise) {
      throw new Error('Expected the squat in the library');
    }
    await archiveExercise(db, squatExercise.id, '2026-10-26T02:00:00.000Z');
    const historical = await loadSession(db, sessionId);
    expect(historical?.exercises[0]?.name).toBe('Back Squat');
    expect(historical?.exercises[0]?.prescribedWeight).toBe(20);

    const series = await weightSeries(db, squatExercise.id);
    expect(series).toEqual([
      { sessionId, completedAt: '2026-10-26T01:20:00.000Z', weight: 20 },
    ]);

    db.close();
  });

  it('rolls back a finish with no completed sets and leaves an abandoned workout unchanged', async () => {
    const db = await ready();
    const fullBody = (await listPrograms(db)).find(program => program.name === 'Full Body');
    if (!fullBody) {
      throw new Error('Expected the Full Body program');
    }
    await adoptProgram(db, fullBody.id, '2026-10-27T00:00:00.000Z');
    const today = await loadToday(db, 3);
    if (!today.day) {
      throw new Error('Expected Full Body B');
    }
    const deadlift = today.day.exercises.find(exercise => exercise.name === 'Deadlift');
    const sessionId = await startSession(db, today.day.id, '2026-10-27T01:00:00.000Z');
    await expect(finishSession(db, sessionId, '2026-10-27T01:10:00.000Z')).rejects.toThrow(
      /at least one completed set/,
    );
    expect((await loadSession(db, sessionId))?.status).toBe('in_progress');

    const opened = await loadSession(db, sessionId);
    const firstSet = opened?.exercises[0]?.sets[0];
    if (!firstSet) {
      throw new Error('Expected a set');
    }
    await completeSet(db, firstSet.id, 20, 5, '2026-10-27T01:15:00.000Z');
    await abandonSession(db, sessionId, '2026-10-27T01:20:00.000Z');

    const after = await loadToday(db, 3);
    expect(after.day?.exercises.find(exercise => exercise.name === 'Deadlift')).toMatchObject({
      weight: deadlift?.weight,
      reps: deadlift?.reps,
    });
    expect(await listPersonalRecords(db)).toHaveLength(0);
    expect((await loadSession(db, sessionId))?.status).toBe('abandoned');

    await addBodyWeight(db, '72.5', '2026-10-27T01:30:00.000Z');
    const created = await createExercise(
      db,
      { name: 'Pause Squat', muscleGroupId: 'muscle-quads', equipmentId: 'equip-barbell' },
      '2026-10-27T01:40:00.000Z',
    );
    await expect(
      createExercise(
        db,
        { name: 'pause squat', muscleGroupId: null, equipmentId: null },
        '2026-10-27T01:41:00.000Z',
      ),
    ).rejects.toThrow(TrainingError);

    const stats = await weekStats(db, '2026-10-26T00:00:00.000Z');
    expect(stats.workouts).toBe(0);
    expect(await listExercises(db)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created, name: 'Pause Squat' })]),
    );

    db.close();
  });
});
