import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BarChart } from '../../../components/charts/BarChart';
import { WeightChart } from '../../../components/charts/WeightChart';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Metric } from '../../../components/ui/Metric';
import { Reveal } from '../../../components/ui/Reveal';
import { getExecutor } from '../../../database/client/database';
import { useLoad } from '../../../navigation/useLoad';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { formatWhen } from '../../../utils/time';
import { formatLoad, formatWeight } from '../../workouts/domain/format';
import { BackupPanel } from '../../backup/BackupPanel';
import { getLastBackupAt } from '../../backup/data/backup';
import { StreakSummary } from '../components/StreakSummary';
import { loadDashboard } from '../data/dashboard';
import { listMeasurements, listPersonalRecords } from '../data/progress';
import { loadTrainingPulse } from '../data/streak';
import type { Dashboard, MuscleShare } from '../domain/dashboard';

export function ProgressScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const load = useCallback(async () => {
    const executor = getExecutor();
    const [dashboard, records, measurements, lastBackupAt, pulse] = await Promise.all([
      loadDashboard(executor, new Date()),
      listPersonalRecords(executor),
      listMeasurements(executor),
      getLastBackupAt(executor),
      loadTrainingPulse(executor),
    ]);
    return { dashboard, records, measurements, lastBackupAt, pulse };
  }, []);
  const { data, error, loading, reload } = useLoad(load);

  if (loading) {
    return <LoadingState message="Loading progress" />;
  }
  if (error || !data) {
    return (
      <ErrorState
        title="Progress unavailable"
        message={error ?? 'Try again.'}
        onRetry={() => {
          reload().catch(() => undefined);
        }}
      />
    );
  }

  const { dashboard } = data;
  const hasVolume = dashboard.weeks.some(week => week.volume > 0);
  const bodyPoints = dashboard.bodySeries.map(point => ({
    sessionId: point.measuredAt,
    completedAt: point.measuredAt,
    weight: point.value,
  }));

  return (
    <ScrollScreen
      topInset
      safeBottom={false}
      header={<ScreenHeader title="Progress" detail="Training, strength, and body weight" />}>
      <Reveal>
        <StreakSummary streak={data.pulse.streak} message={data.pulse.message} />
      </Reveal>

      <Text accessibilityRole="header" style={[theme.typography.title2, styles.section, { color: theme.colors.label }]}>
        This week
      </Text>
      <MetricGrid
        items={[
          { value: String(dashboard.workoutsThisWeek), label: 'Workouts', hint: `Last week ${dashboard.workoutsLastWeek}` },
          { value: String(dashboard.setsThisWeek), label: 'Sets' },
          { value: String(dashboard.repsThisWeek), label: 'Reps' },
          { value: kilograms(dashboard.volumeThisWeek), label: 'Volume', hint: volumeHint(dashboard) },
          { value: String(dashboard.recordsThisWeek), label: 'Records' },
          { value: String(dashboard.trainedDaysThisWeek), label: 'Days trained' },
        ]}
      />

      <Text accessibilityRole="header" style={[theme.typography.title2, styles.section, { color: theme.colors.label }]}>
        Weekly volume
      </Text>
      <Text style={[theme.typography.footnote, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xs }]}>
        Last 8 weeks, from completed sets
      </Text>
      {hasVolume ? (
        <BarChart bars={dashboard.weeks.map(week => ({ label: week.label, value: week.volume }))} unit="kg" />
      ) : (
        <Text style={[theme.typography.body, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.sm }]}>
          Finish a workout with a loaded set to see volume here.
        </Text>
      )}

      <Text accessibilityRole="header" style={[theme.typography.title2, styles.section, { color: theme.colors.label }]}>
        All time
      </Text>
      <MetricGrid
        items={[
          { value: String(dashboard.workouts), label: 'Workouts' },
          { value: String(dashboard.sets), label: 'Sets' },
          { value: String(dashboard.reps), label: 'Reps' },
          { value: kilograms(dashboard.volume), label: 'Volume' },
          { value: optionalNumber(dashboard.averageSets), label: 'Avg sets' },
          { value: dashboard.averageVolume === null ? '—' : kilograms(dashboard.averageVolume), label: 'Avg volume' },
          { value: minutes(dashboard.averageMinutes), label: 'Avg time' },
          { value: minutes(dashboard.longestMinutes), label: 'Longest' },
          {
            value: dashboard.heaviest ? kilograms(dashboard.heaviest.value) : '—',
            label: 'Heaviest',
            hint: dashboard.heaviest?.exerciseName,
          },
          {
            value: dashboard.bestEstimate ? kilograms(dashboard.bestEstimate.value) : '—',
            label: 'Best estimate',
            hint: dashboard.bestEstimate?.exerciseName,
          },
          { value: String(dashboard.records), label: 'Records' },
          { value: dashboard.finishRate === null ? '—' : `${dashboard.finishRate}%`, label: 'Finish rate' },
          { value: String(dashboard.trainedDaysLast28), label: 'Days / 28' },
        ]}
      />

      <Text accessibilityRole="header" style={[theme.typography.title2, styles.section, { color: theme.colors.label }]}>
        Sets by muscle
      </Text>
      {dashboard.muscles.length === 0 ? (
        <Text style={[theme.typography.body, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.sm }]}>
          Completed sets will show which muscles you train most.
        </Text>
      ) : (
        <MuscleBars muscles={dashboard.muscles} />
      )}

      <Text accessibilityRole="header" style={[theme.typography.title2, styles.section, { color: theme.colors.label }]}>
        Records
      </Text>
      {data.records.length === 0 ? (
        <EmptyState title="No records yet" message="A finished set becomes a record when it beats your best estimate." icon="chart" />
      ) : (
        data.records.map(record => (
          <Card
            key={record.exerciseId}
            accessibilityLabel={record.exerciseName}
            onPress={() => navigation.navigate('ExerciseProgress', { exerciseId: record.exerciseId })}>
            <Text style={[theme.typography.headline, { color: theme.colors.label }]}>{record.exerciseName}</Text>
            <Text style={[theme.typography.subhead, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.xxs }]}>
              {formatLoad(record.weight, record.reps)} · est. {formatWeight(record.estimatedOneRepMax)} kg · {formatWhen(record.achievedAt)}
            </Text>
          </Card>
        ))
      )}

      <Text accessibilityRole="header" style={[theme.typography.title2, styles.section, { color: theme.colors.label }]}>
        Body weight
      </Text>
      {dashboard.bodyWeight ? (
        <Text style={[theme.typography.body, { color: theme.colors.label, marginTop: theme.spacing.sm }]}>
          {formatWeight(dashboard.bodyWeight.latest)} kg · {formatChange(dashboard.bodyWeight.change)}
        </Text>
      ) : (
        <Text style={[theme.typography.body, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.sm }]}>
          No measurements yet.
        </Text>
      )}
      {bodyPoints.length >= 2 ? <WeightChart points={bodyPoints} /> : null}
      {data.measurements.map(entry => (
        <Text key={entry.id} style={[theme.typography.subhead, { color: theme.colors.secondaryLabel, marginTop: theme.spacing.sm }]}>
          {formatWeight(entry.value)} {entry.unit} · {formatWhen(entry.measuredAt)}
        </Text>
      ))}
      <Button label="Log body weight" icon="scale" variant="secondary" onPress={() => navigation.navigate('MeasurementForm')} />
      <BackupPanel lastBackupAt={data.lastBackupAt} onChanged={reload} />
    </ScrollScreen>
  );
}

function MetricGrid({ items }: { items: ReadonlyArray<{ value: string; label: string; hint?: string }> }) {
  return (
    <View style={styles.metrics}>
      {items.map(item => (
        <View key={item.label} style={styles.cell}>
          <Metric value={item.value} label={item.label} hint={item.hint} />
        </View>
      ))}
    </View>
  );
}

function MuscleBars({ muscles }: { muscles: readonly MuscleShare[] }) {
  const theme = useTheme();
  const max = Math.max(...muscles.map(muscle => muscle.sets), 1);

  return (
    <View style={{ marginTop: theme.spacing.sm }}>
      {muscles.map(muscle => (
        <View key={muscle.name} style={{ marginTop: theme.spacing.sm }}>
          <View style={styles.muscleLabel}>
            <Text style={[theme.typography.subhead, { color: theme.colors.label }]}>{muscle.name}</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.secondaryLabel }]}>{muscle.sets}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.colors.accentSoft, marginTop: theme.spacing.xxs }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: theme.colors.accent, width: `${(muscle.sets / max) * 100}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function kilograms(value: number): string {
  return `${formatWeight(value)} kg`;
}

function optionalNumber(value: number | null): string {
  return value === null ? '—' : String(value);
}

function minutes(value: number | null): string {
  return value === null ? '—' : `${value} min`;
}

function volumeHint(dashboard: Dashboard): string {
  const delta = Math.round((dashboard.volumeThisWeek - dashboard.volumeLastWeek) * 10) / 10;
  if (delta === 0) {
    return 'Same as last week';
  }
  const sign = delta > 0 ? '+' : '';
  return `${sign}${formatWeight(delta)} kg vs last week`;
}

function formatChange(change: number | null): string {
  if (change === null) {
    return 'first log';
  }
  const sign = change > 0 ? '+' : '';
  return `${sign}${formatWeight(change)} kg vs last log`;
}

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cell: {
    width: '48%',
    marginBottom: 12,
  },
  muscleLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});
