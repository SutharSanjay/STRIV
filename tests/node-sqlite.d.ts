declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      all(
        ...params: ReadonlyArray<string | number | null>
      ): Array<Record<string, unknown>>;
      run(...params: ReadonlyArray<string | number | null>): unknown;
    };
    close(): void;
  }
}
