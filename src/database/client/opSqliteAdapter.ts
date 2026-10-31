import type { DB, Scalar } from '@op-engineering/op-sqlite';

import type { SqlExecutor, SqlValue, StatementResult } from '../migrate';

type QueryRows = {
  rowsAffected: number;
  insertId?: number;
  rows: Array<Record<string, unknown>> | { _array?: Array<Record<string, unknown>> };
};

/**
 * Runtime shape Drizzle ORM 0.45 calls on an op-sqlite connection.
 * op-sqlite 19 removed `executeAsync`, `executeRawAsync`, and `rows._array`.
 */
export type LegacyOpSqliteClient = {
  execute(sql: string, params?: Scalar[]): QueryRows;
  executeAsync(sql: string, params?: Scalar[]): Promise<QueryRows>;
  executeRawAsync(sql: string, params?: Scalar[]): Promise<unknown[][]>;
};

function toParams(params?: readonly SqlValue[]): Scalar[] | undefined {
  return params ? [...params] : undefined;
}

function asRows(rows: Array<Record<string, unknown>>): QueryRows['rows'] {
  return { _array: rows };
}

/**
 * Drizzle ORM 0.45.4 is the stable release. Its op-sqlite driver still calls
 * the pre-17 connection API, and it commits transactions without awaiting them.
 * op-sqlite 19 is the release that matches React Native 0.87.
 *
 * This adapter is the boundary between those two. Migrations do not go through
 * Drizzle's transaction helper. They use op-sqlite's own transaction, which
 * rolls back when the callback throws.
 */
export function adaptOpSqlite(db: DB): LegacyOpSqliteClient {
  return {
    execute(sql, params) {
      const result = db.executeSync(sql, params);
      return {
        rowsAffected: result.rowsAffected,
        insertId: result.insertId,
        rows: asRows(result.rows),
      };
    },
    async executeAsync(sql, params) {
      const result = await db.execute(sql, params);
      return {
        rowsAffected: result.rowsAffected,
        insertId: result.insertId,
        rows: asRows(result.rows),
      };
    },
    async executeRawAsync(sql, params) {
      const result = await db.executeRaw(sql, params);
      return result.rawRows;
    },
  };
}

export function asSqlExecutor(db: DB): SqlExecutor {
  const execute = async (
    sql: string,
    params?: readonly SqlValue[],
  ): Promise<StatementResult> => {
    const result = await db.execute(sql, toParams(params));
    return { rows: result.rows };
  };

  return {
    execute,
    transaction: async work => {
      let value: unknown;
      await db.transaction(async tx => {
        const txExecutor: SqlExecutor = {
          execute: async (sql, params) => {
            const result = await tx.execute(sql, toParams(params));
            return { rows: result.rows };
          },
          transaction: () => {
            throw new Error('Nested database transactions are not supported');
          },
        };
        value = await work(txExecutor);
      });
      return value as Awaited<ReturnType<typeof work>>;
    },
  };
}
