import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { Reveal } from '../../../components/ui/Reveal';
import { TextField } from '../../../components/ui/TextField';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { nowIso } from '../../../utils/time';
import { recommendNextSession } from '../../progression/domain/recommend';
import { visibleError } from '../../training/errors';
import { formatLoad, formatWeight } from '../domain/format';
import { parseReps, parseWeight } from '../domain/validation';
import {
  abandonSession,
  completeSet,
  finishSession,
  loadSession,
  saveSetDraft,
  undoSet,
  type SessionSet,
} from '../data/sessions';
import { useDraftStore, type SetDraft } from '../state/drafts';

type Props = NativeStackScreenProps<RootStackParamList, 'Session' | 'SessionDetail'>;

export function SessionScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const readOnly = route.name === 'SessionDetail';
  const load = useCallback(
    () => loadSession(getExecutor(), route.params.sessionId),
    [route.params.sessionId],
  );
  const { data, error, loading, reload } = useLoad(load);
  const hydrate = useDraftStore(state => state.hydrate);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }
    navigation.setOptions({ title: data.dayName });
    for (const exercise of data.exercises) {
      for (const set of exercise.sets) {
        hydrate(set.id, {
          weight: set.weight === null ? '' : formatWeight(set.weight),
          reps: set.reps === null ? '' : String(set.reps),
        });
      }
    }
  }, [data, hydrate, navigation]);

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await work();
      await reload();
    } catch (err) {
      setActionError(visibleError(err, 'That change could not be saved.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading workout" />;
  }
  if (error || !data) {
    return (
      <ErrorState
        title="Workout unavailable"
        message={error ?? 'That workout could not be found.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  const logging = data.status === 'in_progress' && !readOnly;

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollScreen>
        <Text style={[theme.typography.footnote, { color: theme.colors.accent }]}>
          {data.splitName}
        </Text>
        {data.exercises.map((exercise, index) => {
          const completed = exercise.sets.flatMap(set =>
            set.completedAt && set.weight !== null && set.reps !== null
              ? [{ weight: set.weight, reps: set.reps, completed: true }]
              : [],
          );
          let next = null;
          if (completed.length > 0) {
            try {
              next = recommendNextSession(
                {
                  repMin: exercise.repMin,
                  repMax: exercise.repMax,
                  targetSets: exercise.targetSets,
                  currentWeight: exercise.prescribedWeight,
                  increment: exercise.increment,
                },
                completed,
              );
            } catch {
              next = null;
            }
          }
          return (
            <Reveal key={exercise.id} index={index}>
            <Card>
              <Text accessibilityRole="header" style={[theme.typography.title2, { color: theme.colors.label }]}>
                {exercise.name}
              </Text>
              <Text style={[theme.typography.subhead, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs }]}>
                {exercise.muscle ? `${exercise.muscle} · ` : ''}
                {formatLoad(exercise.prescribedWeight, exercise.prescribedReps)} · {exercise.repMin}–{exercise.repMax}
              </Text>
              <Text style={[theme.typography.footnote, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.sm }]}>
                {next?.reason ?? exercise.reason}
              </Text>
              {exercise.sets.map(set => (
                <SetRow
                  key={set.id}
                  set={set}
                  logging={logging}
                  disabled={busy}
                  onComplete={(weight, reps) =>
                    run(() => completeSet(getExecutor(), set.id, weight, reps, nowIso()))
                  }
                  onUndo={() => run(() => undoSet(getExecutor(), set.id))}
                  onDraft={async draft => {
                    const weight = draft.weight.trim() === '' ? null : parseWeight(draft.weight);
                    const reps = draft.reps.trim() === '' ? null : parseReps(draft.reps);
                    if ((draft.weight.trim() !== '' && weight === null) || (draft.reps.trim() !== '' && reps === null)) {
                      return;
                    }
                    await saveSetDraft(getExecutor(), set.id, weight, reps);
                  }}
                />
              ))}
            </Card>
            </Reveal>
          );
        })}

        {actionError ? (
          <Text style={[theme.typography.callout, { color: theme.colors.danger, marginTop: theme.spacing.lg }]}>
            {actionError}
          </Text>
        ) : null}

        {logging ? (
          <>
            <Button
              icon="check"
              label={busy ? 'Saving…' : 'Finish workout'}
              onPress={() =>
                run(async () => {
                  await finishSession(getExecutor(), data.id, nowIso());
                  navigation.goBack();
                })
              }
              disabled={busy}
            />
            <Button
              label="Abandon workout"
              variant="danger"
              disabled={busy}
              onPress={() =>
                Alert.alert('Abandon this workout?', 'Next session targets will stay the same.', [
                  { text: 'Keep training', style: 'cancel' },
                  {
                    text: 'Abandon',
                    style: 'destructive',
                    onPress: () => {
                      run(async () => {
                        await abandonSession(getExecutor(), data.id, nowIso());
                        navigation.goBack();
                      }).catch(() => undefined);
                    },
                  },
                ])
              }
            />
          </>
        ) : (
          <Text style={[theme.typography.footnote, { color: theme.colors.tertiaryLabel, marginTop: theme.spacing.xl }]}>
            {data.status === 'completed' ? 'Saved workout' : 'Abandoned workout'}
          </Text>
        )}
      </ScrollScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  logged: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

function SetRow({
  set,
  logging,
  disabled,
  onComplete,
  onUndo,
  onDraft,
}: {
  set: SessionSet;
  logging: boolean;
  disabled: boolean;
  onComplete: (weight: number, reps: number) => void;
  onUndo: () => void;
  onDraft: (draft: SetDraft) => Promise<void>;
}) {
  const theme = useTheme();
  const draft = useDraftStore(state => state.values[set.id]) ?? { weight: '', reps: '' };
  const setField = useDraftStore(state => state.setField);
  const [rowError, setRowError] = useState<string | null>(null);
  const label = `Set ${set.setIndex + 1}`;

  if (set.completedAt || !logging) {
    return (
      <View style={[styles.logged, { marginTop: theme.spacing.md }]}>
        {set.completedAt ? <Icon name="check" color={theme.colors.success} size={18} /> : null}
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.label },
            set.completedAt ? { marginLeft: theme.spacing.xs } : null,
          ]}>
          {label}
          {set.weight !== null && set.reps !== null ? ` · ${formatLoad(set.weight, set.reps)}` : ' · Not logged'}
        </Text>
        {logging && set.completedAt ? (
          <Button label="Undo set" variant="quiet" onPress={onUndo} disabled={disabled} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ marginTop: theme.spacing.sm }}>
      <Text style={[theme.typography.headline, { color: theme.colors.label, marginTop: theme.spacing.sm }]}>
        {label}
      </Text>
      <TextField
        label="Weight (kg)"
        value={draft.weight}
        keyboardType="decimal-pad"
        onChangeText={value => setField(set.id, 'weight', value)}
        onBlur={() => {
          onDraft(useDraftStore.getState().values[set.id] ?? draft).catch(() => undefined);
        }}
      />
      <TextField
        label="Reps"
        value={draft.reps}
        keyboardType="number-pad"
        onChangeText={value => setField(set.id, 'reps', value)}
        onBlur={() => {
          onDraft(useDraftStore.getState().values[set.id] ?? draft).catch(() => undefined);
        }}
      />
      {rowError ? (
        <Text style={[theme.typography.footnote, { color: theme.colors.danger, marginTop: theme.spacing.xs }]}>
          {rowError}
        </Text>
      ) : null}
      <Button
        label="Complete set"
        icon="check"
        variant="secondary"
        disabled={disabled}
        onPress={() => {
          const current = useDraftStore.getState().values[set.id] ?? draft;
          const weight = parseWeight(current.weight);
          const reps = parseReps(current.reps);
          if (weight === null || reps === null) {
            setRowError('Enter a weight from 0 to 500 kg and reps from 1 to 50.');
            return;
          }
          setRowError(null);
          onDraft(current)
            .then(() => onComplete(weight, reps))
            .catch(() => undefined);
        }}
      />
    </View>
  );
}
