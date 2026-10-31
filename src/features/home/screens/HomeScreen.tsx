import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Reveal } from '../../../components/ui/Reveal';
import { APP_TAGLINE } from '../../../constants/app';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { visibleError } from '../../training/errors';
import { nowIso, weekday, weekdayName } from '../../../utils/time';
import { formatLoad } from '../../workouts/domain/format';
import { StreakSummary } from '../../analytics/components/StreakSummary';
import { loadTrainingPulse } from '../../analytics/data/streak';
import { BackupPanel } from '../../backup/BackupPanel';
import { exportBackup } from '../../backup/backupActions';
import { getLastBackupAt } from '../../backup/data/backup';
import { shouldOfferBackupSave, shouldRemindBackup } from '../../backup/domain/schedule';
import { loadToday, startSession } from '../../workouts/data/sessions';

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const executor = getExecutor();
    const [today, lastBackupAt, pulse] = await Promise.all([
      loadToday(executor, weekday()),
      getLastBackupAt(executor),
      loadTrainingPulse(executor),
    ]);
    return { today, lastBackupAt, pulse };
  }, []);
  const { data, error, loading, reload } = useLoad(load);
  const offeredBackup = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!data || offeredBackup.current) {
        return;
      }
      if (!shouldOfferBackupSave(data.lastBackupAt, new Date())) {
        return;
      }
      offeredBackup.current = true;
      exportBackup()
        .then(saved => {
          if (saved) {
            return reload();
          }
        })
        .catch(err => {
          setMessage(visibleError(err, 'The backup could not be saved.'));
        });
    }, [data, reload]),
  );

  async function openWorkout(dayId?: string) {
    if (!data?.today) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const sessionId =
        data.today.inProgressSessionId ??
        (dayId || data.today.day
          ? await startSession(getExecutor(), dayId ?? data.today.day?.id ?? '', nowIso())
          : null);
      if (!sessionId) {
        return;
      }
      navigation.navigate('Session', { sessionId });
    } catch (err) {
      setMessage(visibleError(err, 'The workout could not be started.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading today" />;
  }
  if (error || !data) {
    return <ErrorState title="Today is unavailable" message={error ?? 'Try again.'} onRetry={() => { reload().catch(() => undefined); }} />;
  }

  return (
    <ScrollScreen
      topInset
      safeBottom={false}
      header={
        <Reveal>
          <ScreenHeader eyebrow="STRIV" title={weekdayName(weekday())} detail={APP_TAGLINE} />
        </Reveal>
      }>
      <Reveal>
        <StreakSummary streak={data.pulse.streak} message={data.pulse.message} />
      </Reveal>

      {data.today.activeSplit ? (
        <Reveal index={2}>
          <Text style={[theme.typography.footnote, { color: theme.colors.tertiaryLabel, marginTop: theme.spacing.lg }]}>
            {data.today.activeSplit.name}
          </Text>
        </Reveal>
      ) : null}

      {data.today.inProgressSessionId ? (
        <Button label={busy ? 'Opening…' : 'Resume workout'} icon="play" onPress={openWorkout} disabled={busy} />
      ) : null}

      {!data.today.activeSplit ? (
        <EmptyState title="No workout today" message="Choose a program to start training." icon="spark" />
      ) : null}

      {data.today.activeSplit && !data.today.day && !data.today.inProgressSessionId ? (
        <>
          <EmptyState
            title="Rest day"
            message={
              (data.today.days ?? []).length > 0
                ? 'Nothing is scheduled for today. Train one of the days below.'
                : 'Add a day to this split before training.'
            }
            icon="rest"
          />
          {(data.today.days ?? []).map(day => (
            <Button
              key={day.id}
              label={busy ? 'Starting…' : `Train ${day.name}`}
              icon="play"
              variant="secondary"
              disabled={busy}
              onPress={() => {
                openWorkout(day.id).catch(() => undefined);
              }}
            />
          ))}
        </>
      ) : null}

      {data.today.day ? (
        <Reveal index={3}>
          <Text accessibilityRole="header" style={[theme.typography.title2, { color: theme.colors.label, marginTop: theme.spacing.md }]}>
            {data.today.day.name}
          </Text>
          {data.today.day.exercises.map(exercise => (
            <Card key={exercise.templateExerciseId}>
              <Text style={[theme.typography.headline, { color: theme.colors.label }]}>{exercise.name}</Text>
              <Text style={[theme.typography.subhead, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs }]}>
                {exercise.sets} sets · {formatLoad(exercise.weight, exercise.reps)} · {exercise.repMin}–{exercise.repMax}
              </Text>
            </Card>
          ))}
          {data.today.day.exercises.length === 0 ? (
            <Text style={[theme.typography.body, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.md }]}>
              Add an exercise to this day before starting.
            </Text>
          ) : null}
          {!data.today.inProgressSessionId && data.today.day.exercises.length > 0 ? (
            <Button label={busy ? 'Starting…' : 'Start workout'} icon="play" onPress={openWorkout} disabled={busy} />
          ) : null}
        </Reveal>
      ) : null}

      {message ? (
        <Text style={[theme.typography.callout, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
          {message}
        </Text>
      ) : null}

      {shouldRemindBackup(
        data.lastBackupAt,
        Boolean(data.today.activeSplit || data.today.inProgressSessionId),
        new Date(),
      ) ? (
        <BackupPanel lastBackupAt={data.lastBackupAt} onChanged={reload} />
      ) : null}

      <View style={[styles.actions, { marginTop: theme.spacing.sm }]}>
        <View style={styles.action}>
          <Button label="Programs" icon="spark" variant="secondary" onPress={() => navigation.navigate('Programs')} />
        </View>
        <View style={styles.action}>
          <Button label="Splits" icon="dumbbell" variant="secondary" onPress={() => navigation.navigate('Splits')} />
        </View>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
  },
});
