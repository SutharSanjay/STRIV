import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';
import { formatWhen } from '../../utils/time';
import { visibleError } from '../training/errors';
import { exportBackup, importBackup } from './backupActions';

type BackupPanelProps = {
  lastBackupAt: string | null;
  onChanged: () => Promise<void>;
};

export function BackupPanel({ lastBackupAt, onChanged }: BackupPanelProps) {
  const theme = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await exportBackup();
      if (saved) {
        await onChanged();
      }
    } catch (error) {
      setMessage(visibleError(error, 'The backup could not be saved.'));
    } finally {
      setBusy(false);
    }
  }

  function confirmRestore() {
    Alert.alert(
      'Replace the training record on this phone?',
      'The backup replaces the workouts, splits, and body weight stored on this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            setMessage(null);
            importBackup()
              .then(async restored => {
                if (restored) {
                  await onChanged();
                }
              })
              .catch(error => {
                setMessage(visibleError(error, 'The backup could not be restored.'));
              })
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  }

  return (
    <Card>
      <Text accessibilityRole="header" style={[theme.typography.title2, { color: theme.colors.label }]}>
        Backup
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.sm }]}>
        Save a copy in Files or iCloud. That copy remains if STRIV is deleted, and restore puts it back on this phone.
      </Text>
      <Text style={[theme.typography.subhead, { color: theme.colors.tertiaryLabel, marginTop: theme.spacing.sm }]}>
        {lastBackupAt ? `Last backup ${formatWhen(lastBackupAt)}` : 'No backup saved yet'}
      </Text>
      {message ? (
        <Text style={[theme.typography.callout, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
          {message}
        </Text>
      ) : null}
      <Button icon="backup" label={busy ? 'Working…' : 'Back up now'} onPress={() => { save().catch(() => undefined); }} disabled={busy} />
      <Button label="Restore backup" variant="secondary" onPress={confirmRestore} disabled={busy} />
    </Card>
  );
}
