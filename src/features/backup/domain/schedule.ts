const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function backupIsDue(lastBackupAt: string | null, now: Date): boolean {
  if (!lastBackupAt) {
    return true;
  }
  const savedAt = new Date(lastBackupAt).getTime();
  if (!Number.isFinite(savedAt)) {
    return true;
  }
  return now.getTime() - savedAt >= WEEK_MS;
}

/** Open the save dialog only after a real backup is at least seven days old. */
export function shouldOfferBackupSave(lastBackupAt: string | null, now: Date): boolean {
  return lastBackupAt !== null && backupIsDue(lastBackupAt, now);
}

/** Remind on Today once there is training to lose and the last copy is a week old. */
export function shouldRemindBackup(
  lastBackupAt: string | null,
  hasTraining: boolean,
  now: Date,
): boolean {
  return hasTraining && backupIsDue(lastBackupAt, now);
}
