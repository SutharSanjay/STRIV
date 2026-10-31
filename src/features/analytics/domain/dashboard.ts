import { estimateOneRepMax } from '../../progression/domain/records';
import { addLocalDays, localDateKey, localDayDistance, startOfLocalDay, startOfWeekIso } from '../../../utils/time';

export type DashboardSession = {
  status: 'completed' | 'abandoned';
  startedAt: string;
  completedAt: string | null;
};

export type DashboardSet = {
  completedAt: string;
  weight: number | null;
  reps: number | null;
  exerciseName: string;
  muscleGroupName: string | null;
};

export type DashboardRecord = {
  exerciseName: string;
  estimatedOneRepMax: number;
  achievedAt: string;
};

export type DashboardWeight = {
  value: number;
  measuredAt: string;
};

export type WeekBar = {
  label: string;
  workouts: number;
  sets: number;
  reps: number;
  volume: number;
};

export type MuscleShare = {
  name: string;
  sets: number;
};

export type NamedValue = {
  exerciseName: string;
  value: number;
};

export type Dashboard = {
  workouts: number;
  workoutsThisWeek: number;
  workoutsLastWeek: number;
  sets: number;
  setsThisWeek: number;
  reps: number;
  repsThisWeek: number;
  volume: number;
  volumeThisWeek: number;
  volumeLastWeek: number;
  averageSets: number | null;
  averageVolume: number | null;
  averageMinutes: number | null;
  longestMinutes: number | null;
  heaviest: NamedValue | null;
  bestEstimate: NamedValue | null;
  records: number;
  recordsThisWeek: number;
  trainedDaysThisWeek: number;
  trainedDaysLast28: number;
  finishRate: number | null;
  muscles: MuscleShare[];
  weeks: WeekBar[];
  bodyWeight: { latest: number; change: number | null } | null;
  bodySeries: Array<{ measuredAt: string; value: number }>;
};

export type DashboardInput = {
  now: Date;
  sessions: readonly DashboardSession[];
  sets: readonly DashboardSet[];
  records: readonly DashboardRecord[];
  weights: readonly DashboardWeight[];
};

const WEEK_COUNT = 8;
const MUSCLE_LIMIT = 6;
const MIN_SESSION_MINUTES = 1;
const MAX_SESSION_MINUTES = 300;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function inRange(iso: string, startMs: number, endMs: number): boolean {
  const time = new Date(iso).getTime();
  return time >= startMs && time < endMs;
}

function sessionMinutes(session: DashboardSession): number | null {
  if (!session.completedAt) {
    return null;
  }
  const start = new Date(session.startedAt).getTime();
  const end = new Date(session.completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }
  const minutes = (end - start) / 60_000;
  if (minutes < MIN_SESSION_MINUTES || minutes > MAX_SESSION_MINUTES) {
    return null;
  }
  return Math.round(minutes);
}

function weekLabel(start: Date): string {
  return `${start.getMonth() + 1}/${start.getDate()}`;
}

function setVolume(set: DashboardSet): number {
  if (set.weight === null || set.reps === null || set.weight <= 0 || set.reps < 1) {
    return 0;
  }
  return set.weight * set.reps;
}

function weekBar(
  weeks: WeekBar[],
  firstWeek: Date,
  iso: string,
  nextWeekMs: number,
): WeekBar | null {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time) || time >= nextWeekMs) {
    return null;
  }
  const bucket = Math.floor(localDayDistance(firstWeek, new Date(iso)) / 7);
  if (bucket < 0 || bucket >= weeks.length) {
    return null;
  }
  return weeks[bucket] ?? null;
}

function setReps(set: DashboardSet): number {
  if (set.reps === null || set.reps < 1) {
    return 0;
  }
  return set.reps;
}

export function buildDashboard(input: DashboardInput): Dashboard {
  const weekStart = new Date(startOfWeekIso(input.now));
  const weekStartMs = weekStart.getTime();
  const nextWeekMs = addLocalDays(weekStart, 7).getTime();
  const lastWeekMs = addLocalDays(weekStart, -7).getTime();
  const firstWeek = addLocalDays(weekStart, -7 * (WEEK_COUNT - 1));
  const recentStart = localDateKey(addLocalDays(startOfLocalDay(input.now), -27));
  const todayKey = localDateKey(input.now);

  const completed = input.sessions.filter(session => session.status === 'completed' && session.completedAt);
  const abandoned = input.sessions.filter(session => session.status === 'abandoned').length;
  const finished = completed.length;
  const decided = finished + abandoned;

  const weeks: WeekBar[] = [];
  for (let index = WEEK_COUNT - 1; index >= 0; index -= 1) {
    const start = addLocalDays(weekStart, -7 * index);
    weeks.push({
      label: weekLabel(start),
      workouts: 0,
      sets: 0,
      reps: 0,
      volume: 0,
    });
  }
  let sets = 0;
  let setsThisWeek = 0;
  let reps = 0;
  let repsThisWeek = 0;
  let volume = 0;
  let volumeThisWeek = 0;
  let volumeLastWeek = 0;
  let heaviest: NamedValue | null = null;
  let bestEstimate: NamedValue | null = null;
  const muscleCounts = new Map<string, number>();

  for (const set of input.sets) {
    const time = new Date(set.completedAt).getTime();
    if (!Number.isFinite(time)) {
      continue;
    }
    const load = setVolume(set);
    const repetitions = setReps(set);
    sets += 1;
    reps += repetitions;
    volume += load;
    if (time >= weekStartMs && time < nextWeekMs) {
      setsThisWeek += 1;
      repsThisWeek += repetitions;
      volumeThisWeek += load;
    } else if (time >= lastWeekMs && time < weekStartMs) {
      volumeLastWeek += load;
    }
    if (set.weight !== null && set.weight > 0 && (heaviest === null || set.weight > heaviest.value)) {
      heaviest = { exerciseName: set.exerciseName, value: set.weight };
    }
    if (set.weight !== null && set.reps !== null) {
      const estimate = estimateOneRepMax(set.weight, set.reps);
      if (estimate > 0 && (bestEstimate === null || estimate > bestEstimate.value)) {
        bestEstimate = { exerciseName: set.exerciseName, value: estimate };
      }
    }
    if (set.muscleGroupName) {
      muscleCounts.set(set.muscleGroupName, (muscleCounts.get(set.muscleGroupName) ?? 0) + 1);
    }
    const bar = weekBar(weeks, firstWeek, set.completedAt, nextWeekMs);
    if (bar) {
      bar.sets += 1;
      bar.reps += repetitions;
      bar.volume += load;
    }
  }

  const trainedThisWeek = new Set<string>();
  const trainedRecent = new Set<string>();
  let workoutsThisWeek = 0;
  let workoutsLastWeek = 0;
  const durations: number[] = [];

  for (const session of completed) {
    const completedAt = session.completedAt;
    if (!completedAt) {
      continue;
    }
    const time = new Date(completedAt).getTime();
    const day = localDateKey(new Date(completedAt));
    if (day >= recentStart && day <= todayKey) {
      trainedRecent.add(day);
    }
    if (time >= weekStartMs && time < nextWeekMs) {
      workoutsThisWeek += 1;
      trainedThisWeek.add(day);
    } else if (time >= lastWeekMs && time < weekStartMs) {
      workoutsLastWeek += 1;
    }
    const minutes = sessionMinutes(session);
    if (minutes !== null) {
      durations.push(minutes);
    }
    const bar = weekBar(weeks, firstWeek, completedAt, nextWeekMs);
    if (bar) {
      bar.workouts += 1;
    }
  }

  for (const bar of weeks) {
    bar.volume = round1(bar.volume);
  }

  const averageMinutes =
    durations.length === 0 ? null : Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
  const longestMinutes = durations.length === 0 ? null : Math.max(...durations);
  const orderedWeights = [...input.weights].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  const latestWeight = orderedWeights[orderedWeights.length - 1];
  const previousWeight = orderedWeights[orderedWeights.length - 2];

  return {
    workouts: finished,
    workoutsThisWeek,
    workoutsLastWeek,
    sets,
    setsThisWeek,
    reps,
    repsThisWeek,
    volume: round1(volume),
    volumeThisWeek: round1(volumeThisWeek),
    volumeLastWeek: round1(volumeLastWeek),
    averageSets: finished === 0 ? null : round1(sets / finished),
    averageVolume: finished === 0 ? null : round1(volume / finished),
    averageMinutes,
    longestMinutes,
    heaviest,
    bestEstimate,
    records: input.records.length,
    recordsThisWeek: input.records.filter(record => inRange(record.achievedAt, weekStartMs, nextWeekMs)).length,
    trainedDaysThisWeek: trainedThisWeek.size,
    trainedDaysLast28: trainedRecent.size,
    finishRate: decided === 0 ? null : Math.round((finished / decided) * 100),
    muscles: [...muscleCounts.entries()]
      .map(([name, count]) => ({ name, sets: count }))
      .sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name))
      .slice(0, MUSCLE_LIMIT),
    weeks,
    bodyWeight: latestWeight
      ? {
          latest: latestWeight.value,
          change: previousWeight ? round1(latestWeight.value - previousWeight.value) : null,
        }
      : null,
    bodySeries: orderedWeights.map(entry => ({ measuredAt: entry.measuredAt, value: entry.value })),
  };
}
