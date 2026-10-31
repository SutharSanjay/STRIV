import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { nowIso } from '../../../utils/time';
import { visibleError } from '../../training/errors';
import { adoptProgram, listPrograms } from '../data/splits';

export function ProgramsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const load = useCallback(() => listPrograms(getExecutor()), []);
  const { data, error, loading, reload } = useLoad(load);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loading) {
    return <LoadingState message="Loading programs" />;
  }
  if (error || !data) {
    return (
      <ErrorState
        title="Programs unavailable"
        message={error ?? 'Try again.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <ScrollScreen>
      <Text style={[theme.typography.body, { color: theme.colors.secondaryLabel }]}>
        A program is copied into your splits and becomes the one you train.
      </Text>
      {message ? (
        <Text style={[theme.typography.callout, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
          {message}
        </Text>
      ) : null}
      {data.length === 0 ? (
        <EmptyState title="No programs" message="The built-in programs will appear after the training record is ready." />
      ) : null}
      {data.map(program => (
        <Card key={program.id}>
          <Text style={[theme.typography.title2, { color: theme.colors.label }]}>{program.name}</Text>
          <Text style={[theme.typography.subhead, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs }]}>
            {program.dayNames.join(' · ')}
          </Text>
          <Button
            icon="play"
            label={busyId === program.id ? 'Copying…' : 'Use this program'}
            disabled={busyId !== null}
            onPress={() => {
              setBusyId(program.id);
              setMessage(null);
              adoptProgram(getExecutor(), program.id, nowIso())
                .then(() => {
                  navigation.popToTop();
                })
                .catch(err => {
                  setMessage(visibleError(err, 'The program could not be copied.'));
                })
                .finally(() => setBusyId(null));
            }}
          />
        </Card>
      ))}
    </ScrollScreen>
  );
}
