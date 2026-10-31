import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Screen } from '../../../components/layout/Screen';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { TrackedList } from '../../../components/layout/scrollTrack';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { formatWhen } from '../../../utils/time';
import { listHistory, type HistoryEntry } from '../../workouts/data/sessions';

export function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const load = useCallback(() => listHistory(getExecutor()), []);
  const { data, error, loading, reload } = useLoad(load);

  if (loading) {
    return <LoadingState message="Loading history" />;
  }
  if (error || !data) {
    return (
      <ErrorState
        title="History unavailable"
        message={error ?? 'Try again.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <Screen topInset safeBottom={false}>
      <ScreenHeader title="History" detail="Finished workouts" />
      <TrackedList
        data={data}
        keyExtractor={item => item.id}
        keyboardDismissMode="on-drag"
        contentContainerStyle={data.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <EmptyState title="No workouts yet" message="Finished sessions will be listed here." icon="clock" />
        }
        renderItem={({ item }) => (
          <HistoryRow
            item={item}
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

function HistoryRow({ item, onPress }: { item: HistoryEntry; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Card onPress={onPress} accessibilityLabel={item.dayName}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[theme.typography.headline, { color: theme.colors.label }]}>{item.dayName}</Text>
          <Text style={[theme.typography.subhead, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs }]}>
            {item.splitName} · {formatWhen(item.completedAt)}
          </Text>
        </View>
        <Icon name="chevron" color={theme.colors.accent} size={18} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
  },
});
