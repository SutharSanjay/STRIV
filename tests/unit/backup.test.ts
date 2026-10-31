import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { addBodyWeight, listMeasurements } from '../../src/features/analytics/data/progress';
import {
  getLastBackupAt,
  restoreFromFile,
  setLastBackupAt,
  writeBackupFile,
} from '../../src/features/backup/data/backup';
import { quoteSqlPath } from '../../src/features/backup/domain/paths';
import {
  backupIsDue,
  shouldOfferBackupSave,
  shouldRemindBackup,
} from '../../src/features/backup/domain/schedule';
import { TrainingError } from '../../src/features/training/errors';
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

describe('backup schedule', () => {
  const now = new Date('2026-10-31T12:00:00.000Z');

  it('asks again a week after the last copy', () => {
    expect(backupIsDue(null, now)).toBe(true);
    expect(backupIsDue('2026-10-24T12:00:00.000Z', now)).toBe(true);
    expect(backupIsDue('2026-10-30T12:00:00.000Z', now)).toBe(false);
    expect(shouldRemindBackup(null, false, now)).toBe(false);
    expect(shouldRemindBackup(null, true, now)).toBe(true);
    expect(shouldRemindBackup('2026-10-30T12:00:00.000Z', true, now)).toBe(false);
    expect(shouldOfferBackupSave(null, now)).toBe(false);
    expect(shouldOfferBackupSave('2026-10-30T12:00:00.000Z', now)).toBe(false);
    expect(shouldOfferBackupSave('2026-10-24T12:00:00.000Z', now)).toBe(true);
  });

  it('quotes a filesystem path for SQLite', () => {
    expect(quoteSqlPath("/tmp/striv's backup.db")).toBe("'/tmp/striv''s backup.db'");
    expect(() => quoteSqlPath('relative.db')).toThrow();
  });
});

describe('backup restore', () => {
  it('replaces the current record with the saved copy', async () => {
    const db = createExecutor();
    await applyMigrations(db, bundled);
    const directory = mkdtempSync(join(tmpdir(), 'striv-backup-'));
    const backupPath = join(directory, 'striv-backup.db');

    await addBodyWeight(db, '72.5', '2026-10-01T00:00:00.000Z');
    await setLastBackupAt(db, '2026-10-01T00:00:00.000Z');
    await writeBackupFile(db, backupPath);
    await addBodyWeight(db, '80', '2026-10-20T00:00:00.000Z');

    await restoreFromFile(db, backupPath);

    expect(await listMeasurements(db)).toEqual([
      expect.objectContaining({ value: 72.5 }),
    ]);
    expect(await getLastBackupAt(db)).toBe('2026-10-01T00:00:00.000Z');
    db.close();
  });

  it('leaves the current record in place when the file is not a backup', async () => {
    const db = createExecutor();
    await applyMigrations(db, bundled);
    await addBodyWeight(db, '72.5', '2026-10-01T00:00:00.000Z');
    const directory = mkdtempSync(join(tmpdir(), 'striv-backup-'));
    const junk = join(directory, 'notes.txt');
    writeFileSync(junk, 'not a database');

    await expect(restoreFromFile(db, junk)).rejects.toThrow(TrainingError);
    expect(await listMeasurements(db)).toEqual([
      expect.objectContaining({ value: 72.5 }),
    ]);
    db.close();
  });
});
