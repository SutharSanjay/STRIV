import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';

import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { Button } from '../../../components/ui/Button';
import { Choices } from '../../../components/ui/Choices';
import { TextField } from '../../../components/ui/TextField';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { nowIso } from '../../../utils/time';
import { visibleError } from '../../training/errors';
import {
  archiveExercise,
  createExercise,
  getExercise,
  listEquipment,
  listMuscleGroups,
  updateExercise,
} from '../data/exercises';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseForm'>;

export function ExerciseFormScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const exerciseId = route.params?.exerciseId;
  const load = useCallback(async () => {
    const executor = getExecutor();
    const [muscles, equipment, exercise] = await Promise.all([
      listMuscleGroups(executor),
      listEquipment(executor),
      exerciseId ? getExercise(executor, exerciseId) : Promise.resolve(null),
    ]);
    return { muscles, equipment, exercise };
  }, [exerciseId]);
  const { data, error, loading, reload } = useLoad(load);
  const [name, setName] = useState<string | null>(null);
  const [muscleId, setMuscleId] = useState<string | null | undefined>(undefined);
  const [equipmentId, setEquipmentId] = useState<string | null | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <LoadingState message="Loading exercise" />;
  }
  if (error || !data || (exerciseId && !data.exercise)) {
    return (
      <ErrorState
        title="Exercise unavailable"
        message={error ?? 'That exercise is no longer in your library.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  const currentName = name ?? data.exercise?.name ?? '';
  const currentMuscle = muscleId === undefined ? (data.exercise?.muscleGroupId ?? null) : muscleId;
  const currentEquipment = equipmentId === undefined ? (data.exercise?.equipmentId ?? null) : equipmentId;

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const input = {
        name: currentName,
        muscleGroupId: currentMuscle,
        equipmentId: currentEquipment,
      };
      if (exerciseId) {
        await updateExercise(getExecutor(), exerciseId, input, nowIso());
      } else {
        await createExercise(getExecutor(), input, nowIso());
      }
      navigation.goBack();
    } catch (err) {
      setMessage(visibleError(err, 'The exercise could not be saved.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollScreen>
      <TextField label="Name" value={currentName} onChangeText={setName} />
      <Choices
        label="Muscle group"
        value={currentMuscle}
        onChange={setMuscleId}
        options={[{ id: null, label: 'None' }, ...data.muscles.map(item => ({ id: item.id, label: item.name }))]}
      />
      <Choices
        label="Equipment"
        value={currentEquipment}
        onChange={setEquipmentId}
        options={[{ id: null, label: 'None' }, ...data.equipment.map(item => ({ id: item.id, label: item.name }))]}
      />
      {message ? (
        <Text style={[theme.typography.callout, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
          {message}
        </Text>
      ) : null}
      <Button label={busy ? 'Saving…' : 'Save'} onPress={save} disabled={busy} />
      {exerciseId ? (
        <Button
          label="Remove from library"
          variant="danger"
          disabled={busy}
          onPress={() =>
            Alert.alert('Remove this exercise?', 'Past workouts keep the name that was logged.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  archiveExercise(getExecutor(), exerciseId, nowIso())
                    .then(() => navigation.goBack())
                    .catch(err => setMessage(visibleError(err, 'The exercise could not be removed.')));
                },
              },
            ])
          }
        />
      ) : null}
    </ScrollScreen>
  );
}
