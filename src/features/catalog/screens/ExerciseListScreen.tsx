import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Screen } from '../../../components/layout/Screen';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { TrackedList } from '../../../components/layout/scrollTrack';
import { Card } from '../../../components/ui/Card';
import { HeaderLabel } from '../../../components/ui/HeaderLabel';
import { Icon } from '../../../components/ui/Icon';
import { TextField } from '../../../components/ui/TextField';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { listExercises, type ExerciseDetails } from '../data/exercises';

function AddExerciseButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <HeaderLabel label="Add" onPress={() => navigation.navigate('ExerciseForm')} />;
}

export function ExerciseListScreen() {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const load = useCallback(() => listExercises(getExecutor()), []);
  const { data, error, loading, reload } = useLoad(load);

  if (loading) {
    return <LoadingState message="Loading exercises" />;
  }
  if (error || !data) {
    return (
      <ErrorState
        title="Exercises unavailable"
        message={error ?? 'Try again.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  const needle = query.trim().toLowerCase();
  const muscles = [
    ...new Set(data.flatMap(exercise => (exercise.muscleGroupName ? [exercise.muscleGroupName] : []))),
  ].sort();
  const exercises = data.filter(exercise => {
    const matchesName = needle.length === 0 || exercise.name.toLowerCase().includes(needle);
    const matchesMuscle = muscle === null || exercise.muscleGroupName === muscle;
    return matchesName && matchesMuscle;
  });

  return (
    <Screen topInset safeBottom={false}>
      <ScreenHeader title="Exercises" detail="Your movement library" action={<AddExerciseButton />} />
      <TextField label="Search" value={query} onChangeText={setQuery} placeholder="Name" />
      <View style={styles.filters}>
        <MuscleChip label="All" selected={muscle === null} onPress={() => setMuscle(null)} />
        {muscles.map(name => (
          <MuscleChip
            key={name}
            label={name}
            selected={muscle === name}
            onPress={() => setMuscle(name)}
          />
        ))}
      </View>
      <TrackedList
        data={exercises}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={exercises.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <EmptyState
            title="No exercises"
            message={needle || muscle ? 'Nothing matches that search.' : 'Add a movement to your library.'}
            icon="dumbbell"
          />
        }
        renderItem={({ item }) => <ExerciseRow item={item} />}
      />
    </Screen>
  );
}

function MuscleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: theme.radius.xl,
          marginRight: theme.spacing.xs,
        },
        selected
          ? { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
          : { backgroundColor: theme.colors.surface, borderColor: theme.colors.separator },
      ]}>
      <Text
        style={[
          theme.typography.caption,
          selected ? { color: theme.colors.accentLabel } : { color: theme.colors.label },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ExerciseRow({ item }: { item: ExerciseDetails }) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const detail = [item.muscleGroupName, item.equipmentName].filter(Boolean).join(' · ');

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('ExerciseForm', { exerciseId: item.id })}
        style={[styles.hit, { minHeight: theme.dimensions.minTouchTarget }]}>
        <Text style={[theme.typography.headline, { color: theme.colors.label }]}>{item.name}</Text>
        {detail ? (
          <Text style={[theme.typography.subhead, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs }]}>
            {detail}
          </Text>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Progress for ${item.name}`}
        onPress={() => navigation.navigate('ExerciseProgress', { exerciseId: item.id })}
        style={[styles.progress, { minHeight: theme.dimensions.minTouchTarget }]}>
        <Icon name="chart" color={theme.colors.accent} size={18} />
        <Text style={[theme.typography.subhead, { color: theme.colors.accent, marginLeft: theme.spacing.xs }]}>
          Progress
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: {
    flexGrow: 1,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 12,
    paddingBottom: 4,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 28,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  hit: {
    justifyContent: 'center',
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
