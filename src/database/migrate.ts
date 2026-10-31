export type MigrationJournalEntry = {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
};

export type MigrationSet = {
  journal: {
    entries: readonly MigrationJournalEntry[];
  };
  migrations: Readonly<Record<string, string>>;
};

export type SqlValue = string | number | null;

export type StatementResult = {
  rows: ReadonlyArray<Readonly<Record<string, unknown>>>;
};

export interface SqlExecutor {
  execute(
    sql: string,
    params?: readonly SqlValue[],
  ): Promise<StatementResult>;
  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}

const MIGRATIONS_TABLE = '__drizzle_migrations';

export function migrationKey(index: number): string {
  return `m${index.toString().padStart(4, '0')}`;
}

export function splitStatements(sql: string): string[] {
  return sql
    .split('--> statement-breakpoint')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);
}

function lastAppliedAt(rows: StatementResult['rows']): number | null {
  const raw = rows[0]?.created_at;
  if (raw === undefined || raw === null) {
    return null;
  }
  const createdAt = Number(raw);
  return Number.isFinite(createdAt) ? createdAt : null;
}

/**
 * Applies bundled SQL migrations.
 *
 * Ordering matches Drizzle: a migration runs when its journal timestamp is
 * newer than the newest row in `__drizzle_migrations`. The tag is stored in
 * `hash` so a later diagnosis can see which file ran. Pending migrations in
 * one launch share a transaction, so a failure does not leave a half-applied
 * batch.
 *
 * The id column is INTEGER PRIMARY KEY. SQLite would store NULL for Drizzle's
 * SERIAL primary key, which is not a usable identifier.
 */
export async function applyMigrations(
  db: SqlExecutor,
  migrations: MigrationSet,
): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )`,
  );

  const existing = await db.execute(
    `SELECT created_at FROM "${MIGRATIONS_TABLE}" ORDER BY created_at DESC LIMIT 1`,
  );
  const appliedAt = lastAppliedAt(existing.rows);
  const pending = migrations.journal.entries.filter(
    entry => appliedAt === null || appliedAt < entry.when,
  );

  if (pending.length === 0) {
    return;
  }

  await db.transaction(async tx => {
    for (const entry of pending) {
      const sql = migrations.migrations[migrationKey(entry.idx)];
      if (!sql) {
        throw new Error(`Missing migration ${entry.tag}`);
      }

      for (const statement of splitStatements(sql)) {
        await tx.execute(statement);
      }

      await tx.execute(
        `INSERT INTO "${MIGRATIONS_TABLE}" ("hash", "created_at") VALUES (?, ?)`,
        [entry.tag, entry.when],
      );
    }
  });
}
