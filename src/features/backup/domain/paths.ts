export function backupFilePath(databasePath: string, now: Date): string {
  const slash = databasePath.lastIndexOf('/');
  const directory = slash >= 0 ? databasePath.slice(0, slash) : '';
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return `${directory}/striv-backup-${stamp}.db`;
}

export function fileUrl(path: string): string {
  return `file://${encodeURI(path)}`;
}

export function localPathFromUri(uri: string): string {
  const withoutScheme = uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
  return decodeURI(withoutScheme);
}

/** SQLite path literals cannot be bound parameters for ATTACH or VACUUM INTO. */
export function quoteSqlPath(path: string): string {
  if (!path.startsWith('/') || /[\0\r\n]/.test(path)) {
    throw new Error('Unsafe backup path');
  }
  return `'${path.replace(/'/g, "''")}'`;
}
