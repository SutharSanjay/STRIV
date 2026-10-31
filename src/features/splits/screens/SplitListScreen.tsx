import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { TextField } from '../../../components/ui/TextField';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { nowIso } from '../../../utils/time';
import { visibleError } from '../../training/errors';
import { createSplit, getActiveSplitId, listUserSplits, setActiveSplit } from '../data/splits';

export function SplitListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const executor = getExecutor();
    const [splits, activeId] = await Promise.all([
      listUserSplits(executor),
      getActiveSplitId(executor),
    ]);
    return { splits, activeId };
  }, []);
  const { data, error, loading, reload } = useLoad(load);

  function create() {
    setBusy(true);
    setMessage(null);
    createSplit(getExecutor(), name, nowIso())
      .then(splitId => {
        setName('');
        navigation.navigate('SplitEditor', { splitId });
      })
      .catch(err => setMessage(visibleError(err, 'The split could not be created.')))
      .finally(() => setBusy(false));
  }

  if (loading) {
    return <LoadingState message="Loading splits" />;
  }
  if (error || !data) {
    return (
      <ErrorState
        title="Splits unavailable"
        message={error ?? 'Try again.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <ScrollScreen>
      <TextField
        label="New split"
        value={name}
        onChangeText={setName}
        placeholder="Name"
        onSubmitEditing={() => {
          if (!busy) {
            create();
          }
        }}
      />
      <Button
        icon="plus"
        label={busy ? 'Creating…' : 'Create split'}
        disabled={busy}
        onPress={create}
      />
      {message ? (
        <Text style={[theme.typography.callout, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
          {message}
        </Text>
      ) : null}
      {data.splits.length === 0 ? (
        <EmptyState title="No splits yet" message="Create one here, or start from a program." />
      ) : null}
      {data.splits.map(split => {
        const active = split.id === data.activeId;
        return (
          <Card key={split.id} tone={active ? 'accent' : 'surface'} accessibilityLabel={split.name}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${split.name}`}
              onPress={() => navigation.navigate('SplitEditor', { splitId: split.id })}
              style={styles.row}>
              <View style={styles.copy}>
                <Text style={[theme.typography.headline, { color: theme.colors.label }]}>
                  {split.name}
                  {active ? ' · Active' : ''}
                </Text>
                <Text style={[theme.typography.subhead, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs }]}>
                  {split.dayNames.length > 0 ? split.dayNames.join(' · ') : 'No days yet'}
                </Text>
              </View>
              <Icon name="chevron" color={theme.colors.accent} size={18} />
            </Pressable>
            {!active ? (
              <Button
                label="Make active"
                variant="secondary"
                onPress={() => {
                  setMessage(null);
                  setActiveSplit(getExecutor(), split.id)
                    .then(() => reload())
                    .catch(err => setMessage(visibleError(err, 'The active split could not be changed.')));
                }}
              />
            ) : null}
          </Card>
        );
      })}
      <Button label="Browse programs" variant="secondary" onPress={() => navigation.navigate('Programs')} />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
  },
});
