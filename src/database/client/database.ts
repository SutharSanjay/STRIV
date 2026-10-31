import { open, type DB } from '@op-engineering/op-sqlite';
import { drizzle, type OPSQLiteDatabase } from 'drizzle-orm/op-sqlite';

import { seedIfEmpty } from '../../features/catalog/data/seed';
import { log } from '../../utils/logger';
import type { SqlExecutor } from '../migrate';
import { applyMigrations } from '../migrate';
import migrations from '../migrations/migrations';
import * as schema from '../schema';
import { adaptOpSqlite, asSqlExecutor } from './opSqliteAdapter';

export const DATABASE_NAME = 'striv.db';
export const FOREIGN_KEYS_PRAGMA = 'PRAGMA foreign_keys = ON';

type AppDatabase = OPSQLiteDatabase<typeof schema>;

let connection: DB | null = null;
let database: AppDatabase | null = null;
let opening: Promise<void> | null = null;

async function start(): Promise<void> {
  const opened = open({ name: DATABASE_NAME });
  connection = opened;
  await opened.execute(FOREIGN_KEYS_PRAGMA);
  const executor = asSqlExecutor(opened);
  await applyMigrations(executor, migrations);
  await seedIfEmpty(executor);
  database = drizzle(adaptOpSqlite(opened), { schema });
}

export function openAndMigrate(): Promise<void> {
  if (database && connection) {
    return Promise.resolve();
  }

  if (!opening) {
    opening = start().catch(error => {
      database = null;
      connection = null;
      opening = null;
      log('error', 'Database migration failed', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      throw error;
    });
  }

  return opening;
}

export function getDatabase(): AppDatabase {
  if (!database) {
    throw new Error('Database is not ready');
  }
  return database;
}

/** Raw connection used for completion transactions. Drizzle's helper commits too early. */
export function getExecutor(): SqlExecutor {
  if (!connection) {
    throw new Error('Database is not ready');
  }
  return asSqlExecutor(connection);
}

export function getDatabasePath(): string {
  if (!connection) {
    throw new Error('Database is not ready');
  }
  return connection.getDbPath();
}
