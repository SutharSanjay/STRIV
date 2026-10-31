import type { SqlExecutor } from '../../../database/migrate';
import { asNullableString, firstRow } from '../../../database/rows';
import { TrainingError } from '../../training/errors';
import { quoteSqlPath } from '../domain/paths';
import { restoreStatements } from '../domain/restoreSql';

export const LAST_BACKUP_KEY = 'last_backup_at';

export async function getLastBackupAt(db: SqlExecutor): Promise<string | null> {
  const row = firstRow(
    await db.execute('SELECT value FROM app_metadata WHERE key = ?', [LAST_BACKUP_KEY]),
  );
  return row ? asNullableString(row.value) : null;
}

export async function setLastBackupAt(db: SqlExecutor, now: string): Promise<void> {
  await db.execute(
    `INSERT INTO app_metadata (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [LAST_BACKUP_KEY, now],
  );
}

export async function writeBackupFile(
  db: SqlExecutor,
  destinationPath: string,
): Promise<void> {
  let literal: string;
  try {
    literal = quoteSqlPath(destinationPath);
  } catch {
    throw new TrainingError('The backup could not be saved.');
  }
  try {
    await db.execute(`VACUUM INTO ${literal}`);
  } catch {
    throw new TrainingError('The backup could not be saved.');
  }
}

export async function restoreFromFile(
  db: SqlExecutor,
  absolutePath: string,
): Promise<void> {
  let literal: string;
  try {
    literal = quoteSqlPath(absolutePath);
  } catch {
    throw new TrainingError('That file is not a STRIV backup.');
  }

  try {
    await db.execute(`ATTACH DATABASE ${literal} AS incoming`);
  } catch {
    throw new TrainingError('That file is not a STRIV backup.');
  }

  try {
    const marker = await db.execute(
      `SELECT name FROM incoming.sqlite_master
       WHERE type = 'table' AND name = 'workout_sessions'`,
    );
    if (marker.rows.length === 0) {
      throw new TrainingError('That file is not a STRIV backup.');
    }
    await db.execute('PRAGMA foreign_keys = OFF');
    await db.transaction(async tx => {
      for (const statement of restoreStatements()) {
        await tx.execute(statement);
      }
    });
  } catch (error) {
    if (error instanceof TrainingError) {
      throw error;
    }
    throw new TrainingError('The backup could not be restored.');
  } finally {
    await db.execute('PRAGMA foreign_keys = ON').catch(() => undefined);
    await db.execute('DETACH DATABASE incoming').catch(() => undefined);
  }
}
