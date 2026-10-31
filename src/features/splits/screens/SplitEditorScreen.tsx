import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Choices } from '../../../components/ui/Choices';
import { TextField } from '../../../components/ui/TextField';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { nowIso, weekdayName } from '../../../utils/time';
import { listExercises } from '../../catalog/data/exercises';
import { TrainingError, visibleError } from '../../training/errors';
import { formatWeight } from '../../workouts/domain/format';
import { parseWeight } from '../../workouts/domain/validation';
import {
  addDay,
  addTemplateExercise,
  archiveSplit,
  getSplit,
  removeDay,
  removeTemplateExercise,
  renameSplit,
  updateDay,
  updateTemplateExercise,
  type TemplateExerciseDetails,
} from '../data/splits';

type Props = NativeStackScreenProps<RootStackParamList, 'SplitEditor'>;

const WEEKDAYS = [
  { id: 'any', label: 'Rotation' },
  { id: '0', label: 'Sun' },
  { id: '1', label: 'Mon' },
  { id: '2', label: 'Tue' },
  { id: '3', label: 'Wed' },
  { id: '4', label: 'Thu' },
  { id: '5', label: 'Fri' },
  { id: '6', label: 'Sat' },
];

function weekdayId(weekday: number | null): string {
  return weekday === null ? 'any' : String(weekday);
}

function parseWeekday(id: string | null): number | null {
  if (id === null || id === 'any') {
    return null;
  }
  return Number(id);
}

export function SplitEditorScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { splitId } = route.params;
  const load = useCallback(async () => {
    const executor = getExecutor();
    const [split, exercises] = await Promise.all([
      getSplit(executor, splitId),
      listExercises(executor),
    ]);
    if (!split) {
      throw new TrainingError('That split could not be found.');
    }
    return { split, exercises };
  }, [splitId]);
  const { data, error, loading, reload } = useLoad(load);
  const [name, setName] = useState<string | null>(null);
  const [dayName, setDayName] = useState('');
  const [dayWeekday, setDayWeekday] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function change(work: () => Promise<unknown>) {
    setMessage(null);
    try {
      await work();
      await reload();
    } catch (err) {
      setMessage(visibleError(err, 'That change could not be saved.'));
    }
  }

  if (loading) {
    return <LoadingState message="Loading split" />;
  }
  if (!data) {
    return (
      <ErrorState
        title="Split unavailable"
        message={error ?? 'That split could not be found.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  const splitName = name ?? data.split.name;
  const usesWeekdays = data.split.days.some(day => day.weekday !== null);
  const takenWeekdays = new Set(
    data.split.days.flatMap(day => (day.weekday === null ? [] : [day.weekday])),
  );
  const freeWeekday = [1, 2, 3, 4, 5, 6, 0].find(day => !takenWeekdays.has(day));
  const scheduleValue =
    dayWeekday ?? (usesWeekdays && freeWeekday !== undefined ? String(freeWeekday) : 'any');

  return (
    <ScrollScreen>
      <TextField
        label="Split name"
        value={splitName}
        onChangeText={setName}
        onBlur={() => {
          if (splitName.trim() === data.split.name) {
            return;
          }
          change(() => renameSplit(getExecutor(), splitId, splitName, nowIso())).catch(() => undefined);
        }}
      />
      {data.split.days.map(day => (
        <Card key={day.id}>
          <Text accessibilityRole="header" style={[theme.typography.title2, { color: theme.colors.label }]}>
            {day.name}
          </Text>
          <Text style={[theme.typography.footnote, { color: theme.colors.tertiaryLabel, marginTop: theme.spacing.xxs }]}>
            {day.weekday === null ? 'Rotates with the other days' : weekdayName(day.weekday)}
          </Text>
          <Choices
            label="Schedule"
            value={weekdayId(day.weekday)}
            options={WEEKDAYS}
            onChange={id => {
              change(() => updateDay(getExecutor(), day.id, day.name, parseWeekday(id), nowIso())).catch(
                () => undefined,
              );
            }}
          />
          {day.exercises.map(exercise => (
            <ExerciseEditor
              key={exercise.id}
              exercise={exercise}
              onSave={input =>
                change(() => updateTemplateExercise(getExecutor(), exercise.id, input, nowIso()))
              }
              onRemove={() =>
                change(() => removeTemplateExercise(getExecutor(), exercise.id, nowIso()))
              }
            />
          ))}
          <AddExercise
            options={data.exercises.map(exercise => ({ id: exercise.id, label: exercise.name }))}
            onAdd={input => change(() => addTemplateExercise(getExecutor(), day.id, input, nowIso()))}
          />
          <Button
            label="Remove day"
            variant="quiet"
            onPress={() => {
              change(() => removeDay(getExecutor(), day.id, nowIso())).catch(() => undefined);
            }}
          />
        </Card>
      ))}

      <View style={{ marginTop: theme.spacing.xxl }}>
        <Text style={[theme.typography.headline, { color: theme.colors.label }]}>Add a day</Text>
        <TextField label="Day name" value={dayName} onChangeText={setDayName} />
        <Choices label="Schedule" value={scheduleValue} options={WEEKDAYS} onChange={setDayWeekday} />
        <Button
          label="Add day"
          variant="secondary"
          onPress={() => {
            change(async () => {
              await addDay(getExecutor(), splitId, dayName, parseWeekday(scheduleValue), nowIso());
              setDayName('');
              setDayWeekday(null);
            }).catch(() => undefined);
          }}
        />
      </View>

      {message ? (
        <Text style={[theme.typography.callout, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
          {message}
        </Text>
      ) : null}

      <Button
        label="Archive split"
        variant="danger"
        onPress={() =>
          Alert.alert('Archive this split?', 'Past workouts stay in your history.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Archive',
              style: 'destructive',
              onPress: () => {
                archiveSplit(getExecutor(), splitId, nowIso())
                  .then(() => navigation.goBack())
                  .catch(err => setMessage(visibleError(err, 'The split could not be archived.')));
              },
            },
          ])
        }
      />
    </ScrollScreen>
  );
}

function ExerciseEditor({
  exercise,
  onSave,
  onRemove,
}: {
  exercise: TemplateExerciseDetails;
  onSave: (input: {
    exerciseId: string;
    targetSets: number;
    repMin: number;
    repMax: number;
    weight: number;
    increment: number;
  }) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const theme = useTheme();
  const [weight, setWeight] = useState(formatWeight(exercise.currentWeight));
  const [increment, setIncrement] = useState(formatWeight(exercise.increment));
  const [sets, setSets] = useState(String(exercise.targetSets));
  const [repMin, setRepMin] = useState(String(exercise.repMin));
  const [repMax, setRepMax] = useState(String(exercise.repMax));

  function save() {
    onSave({
      exerciseId: exercise.exerciseId,
      targetSets: Number(sets),
      repMin: Number(repMin),
      repMax: Number(repMax),
      weight: parseWeight(weight) ?? Number.NaN,
      increment: parseWeight(increment) ?? Number.NaN,
    }).catch(() => undefined);
  }

  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text style={[theme.typography.headline, { color: theme.colors.label }]}>{exercise.name}</Text>
      <Text style={[theme.typography.footnote, { color: theme.colors.tertiaryLabel, marginTop: theme.spacing.xxs }]}>
        Next target {exercise.targetReps} reps
      </Text>
      <TextField label="Weight (kg)" value={weight} onChangeText={setWeight} onBlur={save} keyboardType="decimal-pad" />
      <TextField label="Increment (kg)" value={increment} onChangeText={setIncrement} onBlur={save} keyboardType="decimal-pad" />
      <TextField label="Sets" value={sets} onChangeText={setSets} onBlur={save} keyboardType="number-pad" />
      <TextField label="Rep minimum" value={repMin} onChangeText={setRepMin} onBlur={save} keyboardType="number-pad" />
      <TextField label="Rep maximum" value={repMax} onChangeText={setRepMax} onBlur={save} keyboardType="number-pad" />
      <Button label="Remove exercise" variant="quiet" onPress={() => { onRemove().catch(() => undefined); }} />
    </View>
  );
}

function AddExercise({
  options,
  onAdd,
}: {
  options: { id: string; label: string }[];
  onAdd: (input: {
    exerciseId: string;
    targetSets: number;
    repMin: number;
    repMax: number;
    weight: number;
    increment: number;
  }) => Promise<void>;
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [sets, setSets] = useState('3');
  const [repMin, setRepMin] = useState('5');
  const [repMax, setRepMax] = useState('8');
  const [weight, setWeight] = useState('20');
  const [increment, setIncrement] = useState('2.5');
  const needle = query.trim().toLowerCase();
  const matches =
    needle.length === 0
      ? []
      : options.filter(option => option.label.toLowerCase().includes(needle)).slice(0, 8);

  return (
    <View>
      <TextField
        label="Add exercise"
        value={query}
        onChangeText={text => {
          setQuery(text);
          setExerciseId(null);
        }}
        placeholder="Type a name"
      />
      {matches.map(option => {
        const selected = option.id === exerciseId;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              setExerciseId(option.id);
              setQuery(option.label);
            }}
            style={[
              styles.match,
              {
                borderRadius: theme.radius.sm,
                marginTop: theme.spacing.xs,
                backgroundColor: selected ? theme.colors.accent : theme.colors.backgroundSecondary,
              },
            ]}>
            <Text style={[theme.typography.subhead, { color: selected ? theme.colors.accentLabel : theme.colors.label }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
      {needle.length > 0 && matches.length === 0 ? (
        <Text style={[theme.typography.footnote, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xs }]}>
          No exercise matches that name.
        </Text>
      ) : null}
      <TextField label="Sets" value={sets} onChangeText={setSets} keyboardType="number-pad" />
      <TextField label="Rep minimum" value={repMin} onChangeText={setRepMin} keyboardType="number-pad" />
      <TextField label="Rep maximum" value={repMax} onChangeText={setRepMax} keyboardType="number-pad" />
      <TextField label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
      <TextField label="Increment (kg)" value={increment} onChangeText={setIncrement} keyboardType="decimal-pad" />
      <Button
        label="Add to day"
        variant="secondary"
        onPress={() => {
          onAdd({
            exerciseId: exerciseId ?? '',
            targetSets: Number(sets),
            repMin: Number(repMin),
            repMax: Number(repMax),
            weight: parseWeight(weight) ?? Number.NaN,
            increment: parseWeight(increment) ?? Number.NaN,
          }).catch(() => undefined);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  match: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
