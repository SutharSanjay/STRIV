import { DatabaseSync } from 'node:sqlite';

import {
  applyMigrations,
  type MigrationSet,
  type SqlExecutor,
  type SqlValue,
  type StatementResult,
} from '../../src/database/migrate';
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
    const normalized = sql.trim().toUpperCase();
    if (normalized.startsWith('SELECT')) {
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

describe('applyMigrations', () => {
  it('creates the foundation table from the bundled migration', async () => {
    const db = createExecutor();

    await applyMigrations(db, bundled);

    const tables = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'app_metadata'",
    );
    const applied = await db.execute(
      'SELECT hash, created_at FROM "__drizzle_migrations" ORDER BY created_at',
    );
    const sessions = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workout_sessions'",
    );

    expect(tables.rows).toEqual([{ name: 'app_metadata' }]);
    expect(sessions.rows).toEqual([{ name: 'workout_sessions' }]);
    expect(applied.rows).toEqual(
      bundled.journal.entries.map(entry => ({
        hash: entry.tag,
        created_at: entry.when,
      })),
    );

    db.close();
  });

  it('does not apply the same migration twice', async () => {
    const db = createExecutor();

    await applyMigrations(db, bundled);
    await applyMigrations(db, bundled);

    const applied = await db.execute(
      'SELECT COUNT(*) AS total FROM "__drizzle_migrations"',
    );

    expect(applied.rows).toEqual([{ total: bundled.journal.entries.length }]);
    db.close();
  });

  it('rolls back a failed batch and keeps an earlier successful migration', async () => {
    const db = createExecutor();
    const first: MigrationSet = {
      journal: {
        entries: [{ idx: 0, when: 1, tag: '0000_ok', breakpoints: true }],
      },
      migrations: {
        m0000: 'CREATE TABLE kept (id text PRIMARY KEY);',
      },
    };
    const second: MigrationSet = {
      journal: {
        entries: [
          { idx: 0, when: 1, tag: '0000_ok', breakpoints: true },
          { idx: 1, when: 2, tag: '0001_bad', breakpoints: true },
        ],
      },
      migrations: {
        m0000: 'CREATE TABLE kept (id text PRIMARY KEY);',
        m0001: 'THIS IS NOT SQL',
      },
    };

    await applyMigrations(db, first);
    await expect(applyMigrations(db, second)).rejects.toThrow();

    const kept = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'kept'",
    );
    const applied = await db.execute(
      'SELECT hash FROM "__drizzle_migrations" ORDER BY created_at',
    );

    expect(kept.rows).toEqual([{ name: 'kept' }]);
    expect(applied.rows).toEqual([{ hash: '0000_ok' }]);
    db.close();
  });
});
