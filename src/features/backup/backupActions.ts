import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  saveDocuments,
  types,
} from '@react-native-documents/picker';

import { getDatabasePath, getExecutor } from '../../database/client/database';
import { nowIso } from '../../utils/time';
import { TrainingError } from '../training/errors';
import { useDraftStore } from '../workouts/state/drafts';
import { restoreFromFile, setLastBackupAt, writeBackupFile } from './data/backup';
import { backupFilePath, fileUrl, localPathFromUri } from './domain/paths';

function canceled(error: unknown): boolean {
  return isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;
}

/** Opens the system save dialog so the copy can live in Files or iCloud. */
export async function exportBackup(): Promise<boolean> {
  const executor = getExecutor();
  const path = backupFilePath(getDatabasePath(), new Date());
  await writeBackupFile(executor, path);
  try {
    const saved = await saveDocuments({
      sourceUris: [fileUrl(path)],
      fileName: 'STRIV-backup.db',
      mimeType: 'application/octet-stream',
      copy: true,
    });
    if (saved.some(item => item.error)) {
      throw new TrainingError('The backup could not be saved.');
    }
  } catch (error) {
    if (canceled(error)) {
      return false;
    }
    if (error instanceof TrainingError) {
      throw error;
    }
    throw new TrainingError('The backup could not be saved.');
  }
  await setLastBackupAt(executor, nowIso());
  return true;
}

/** Replaces the on-device record with a backup the user picks. */
export async function importBackup(): Promise<boolean> {
  let picked: Awaited<ReturnType<typeof pick>>;
  try {
    picked = await pick({ mode: 'import', type: [types.allFiles] });
  } catch (error) {
    if (canceled(error)) {
      return false;
    }
    throw new TrainingError('That backup could not be opened.');
  }

  const file = picked[0];
  if (!file) {
    return false;
  }
  const copies = await keepLocalCopy({
    files: [{ uri: file.uri, fileName: file.name ?? 'striv-backup.db' }],
    destination: 'cachesDirectory',
  });
  const copy = copies[0];
  if (!copy || copy.status !== 'success') {
    throw new TrainingError('That backup could not be opened.');
  }

  await restoreFromFile(getExecutor(), localPathFromUri(copy.localUri));
  useDraftStore.setState({ values: {} });
  return true;
}
