import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import { Text } from 'react-native';

import { WeightChart } from '../../../components/charts/WeightChart';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { formatWhen } from '../../../utils/time';
import { getExercise } from '../../catalog/data/exercises';
import { formatWeight } from '../../workouts/domain/format';
import { weightSeries } from '../data/progress';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseProgress'>;

export function ExerciseProgressScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { exerciseId } = route.params;
  const load = useCallback(async () => {
    const executor = getExecutor();
    const [exercise, points] = await Promise.all([
      getExercise(executor, exerciseId),
      weightSeries(executor, exerciseId),
    ]);
    return { exercise, points };
  }, [exerciseId]);
  const { data, error, loading, reload } = useLoad(load);

  useEffect(() => {
    if (data?.exercise) {
      navigation.setOptions({ title: data.exercise.name });
    }
  }, [data, navigation]);

  if (loading) {
    return <LoadingState message="Loading progress" />;
  }
  if (error || !data?.exercise) {
    return (
      <ErrorState
        title="Progress unavailable"
        message={error ?? 'That exercise could not be found.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <ScrollScreen>
      {data.points.length === 0 ? (
        <EmptyState title="No logged weight" message="Finish a workout with a completed set to see it here." />
      ) : null}
      {data.points.length === 1 ? (
        <Text style={[theme.typography.title2, { color: theme.colors.label }]}>
          {formatWeight(data.points[0]?.weight ?? 0)} kg
          <Text style={[theme.typography.subhead, { color: theme.colors.secondaryLabel }]}>
            {'\n'}
            {data.points[0] ? formatWhen(data.points[0].completedAt) : ''}
          </Text>
        </Text>
      ) : null}
      {data.points.length >= 2 ? <WeightChart points={data.points} /> : null}
    </ScrollScreen>
  );
}
