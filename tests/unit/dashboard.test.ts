import { buildDashboard } from '../../src/features/analytics/domain/dashboard';

const now = new Date(2026, 9, 31, 12, 0, 0);

describe('buildDashboard', () => {
  it('returns empty metrics before any training', () => {
    const dashboard = buildDashboard({ now, sessions: [], sets: [], records: [], weights: [] });

    expect(dashboard.workouts).toBe(0);
    expect(dashboard.volume).toBe(0);
    expect(dashboard.averageSets).toBeNull();
    expect(dashboard.finishRate).toBeNull();
    expect(dashboard.heaviest).toBeNull();
    expect(dashboard.weeks).toHaveLength(8);
    expect(dashboard.weeks.every(week => week.volume === 0)).toBe(true);
    expect(dashboard.bodyWeight).toBeNull();
  });

  it('sums only completed loaded work and keeps bodyweight reps', () => {
    const dashboard = buildDashboard({
      now,
      sessions: [
        {
          status: 'completed',
          startedAt: new Date(2026, 9, 26, 18, 0, 0).toISOString(),
          completedAt: new Date(2026, 9, 26, 19, 10, 0).toISOString(),
        },
        {
          status: 'abandoned',
          startedAt: new Date(2026, 9, 27, 18, 0, 0).toISOString(),
          completedAt: null,
        },
        {
          status: 'completed',
          startedAt: new Date(2026, 9, 20, 7, 0, 0).toISOString(),
          completedAt: new Date(2026, 9, 20, 18, 0, 0).toISOString(),
        },
      ],
      sets: [
        {
          completedAt: new Date(2026, 9, 26, 18, 30, 0).toISOString(),
          weight: 100,
          reps: 5,
          exerciseName: 'Back Squat',
          muscleGroupName: 'Quads',
        },
        {
          completedAt: new Date(2026, 9, 26, 18, 40, 0).toISOString(),
          weight: 0,
          reps: 8,
          exerciseName: 'Pull-Up',
          muscleGroupName: 'Back',
        },
        {
          completedAt: new Date(2026, 9, 20, 8, 0, 0).toISOString(),
          weight: 80,
          reps: 5,
          exerciseName: 'Bench Press',
          muscleGroupName: 'Chest',
        },
      ],
      records: [
        {
          exerciseName: 'Back Squat',
          estimatedOneRepMax: 116.7,
          achievedAt: new Date(2026, 9, 26, 18, 30, 0).toISOString(),
        },
      ],
      weights: [
        { value: 80, measuredAt: '2026-10-01T00:00:00.000Z' },
        { value: 81.5, measuredAt: '2026-10-20T00:00:00.000Z' },
      ],
    });

    expect(dashboard.workouts).toBe(2);
    expect(dashboard.workoutsThisWeek).toBe(1);
    expect(dashboard.workoutsLastWeek).toBe(1);
    expect(dashboard.sets).toBe(3);
    expect(dashboard.setsThisWeek).toBe(2);
    expect(dashboard.reps).toBe(18);
    expect(dashboard.volume).toBe(900);
    expect(dashboard.volumeThisWeek).toBe(500);
    expect(dashboard.volumeLastWeek).toBe(400);
    expect(dashboard.averageSets).toBe(1.5);
    expect(dashboard.averageMinutes).toBe(70);
    expect(dashboard.longestMinutes).toBe(70);
    expect(dashboard.heaviest).toEqual({ exerciseName: 'Back Squat', value: 100 });
    expect(dashboard.bestEstimate?.exerciseName).toBe('Back Squat');
    expect(dashboard.recordsThisWeek).toBe(1);
    expect(dashboard.finishRate).toBe(67);
    expect(dashboard.trainedDaysThisWeek).toBe(1);
    expect(dashboard.muscles.map(muscle => muscle.name)).toEqual(['Back', 'Chest', 'Quads']);
    expect(dashboard.bodyWeight).toEqual({ latest: 81.5, change: 1.5 });
    expect(dashboard.weeks[7]?.workouts).toBe(1);
    expect(dashboard.weeks[6]?.volume).toBe(400);
  });
});
