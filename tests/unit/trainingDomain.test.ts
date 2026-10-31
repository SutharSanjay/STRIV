import { bestWeightBySession } from '../../src/features/analytics/domain/series';
import { estimateOneRepMax, selectPersonalRecord } from '../../src/features/progression/domain/records';
import { assertDaySchedule, resolveTrainingDay } from '../../src/features/splits/domain/schedule';
import { planCompletion } from '../../src/features/workouts/domain/completion';
import { formatLoad } from '../../src/features/workouts/domain/format';
import { parseReps, parseWeight, validateName, ValidationError } from '../../src/features/workouts/domain/validation';
import { startOfWeekIso } from '../../src/utils/time';

describe('validation', () => {
  it('parses training inputs and rejects malformed ones', () => {
    expect(parseWeight('60')).toBe(60);
    expect(parseWeight('62,5')).toBe(62.5);
    expect(parseWeight('60.555')).toBeNull();
    expect(parseWeight('-1')).toBeNull();
    expect(parseReps('8')).toBe(8);
    expect(parseReps('0')).toBeNull();
    expect(parseReps('8.5')).toBeNull();
    expect(validateName('  Bench   Press ', 'Name')).toBe('Bench Press');
    expect(() => validateName('   ', 'Name')).toThrow(ValidationError);
  });
});

describe('personal records', () => {
  it('uses the Epley estimate and ignores ties', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.667, 2);
    expect(
      selectPersonalRecord(
        [
          { setId: 'a', weight: 100, reps: 5 },
          { setId: 'b', weight: 80, reps: 1 },
        ],
        null,
      )?.setId,
    ).toBe('a');
    expect(
      selectPersonalRecord([{ setId: 'a', weight: 100, reps: 5 }], 116.667),
    ).toBeNull();
  });
});

describe('schedule', () => {
  const days = [
    { id: 'a', name: 'Push', position: 0, weekday: 1 },
    { id: 'b', name: 'Pull', position: 1, weekday: 3 },
    { id: 'c', name: 'Legs', position: 2, weekday: 5 },
  ];

  it('matches today to a weekday and treats other days as rest', () => {
    expect(resolveTrainingDay(days, 1, null)?.id).toBe('a');
    expect(resolveTrainingDay(days, 2, 'a')).toBeNull();
  });

  it('rejects a schedule that Today could not select', () => {
    const weekdays = [
      { id: 'a', weekday: 1 },
      { id: 'b', weekday: 3 },
    ];
    expect(assertDaySchedule(weekdays, null, null)).toMatch(/weekday/);
    expect(assertDaySchedule(weekdays, 'b', 1)).toMatch(/already used/);
    expect(assertDaySchedule(weekdays, null, 0)).toBeNull();
    expect(assertDaySchedule([{ id: 'a', weekday: null }], null, 1)).toMatch(/rotation/);
  });

  it('matches a Sunday session', () => {
    expect(
      resolveTrainingDay([{ id: 'sun', name: 'Easy', position: 0, weekday: 0 }], 0, null)?.id,
    ).toBe('sun');
  });

  it('rotates in order when no weekdays are set', () => {
    const rotation = days.map(day => ({ ...day, weekday: null }));
    expect(resolveTrainingDay(rotation, 4, null)?.id).toBe('a');
    expect(resolveTrainingDay(rotation, 4, 'c')?.id).toBe('a');
    expect(resolveTrainingDay(rotation, 4, 'a')?.id).toBe('b');
  });
});

describe('completion plan', () => {
  it('updates the template and records a heavier set only', () => {
    const plan = planCompletion([
      {
        exerciseId: 'squat',
        templateExerciseId: 'tpl-1',
        repMin: 5,
        repMax: 8,
        targetSets: 2,
        prescribedWeight: 100,
        increment: 2.5,
        previousBestE1rm: 120,
        sets: [
          { id: 's1', weight: 100, reps: 8, completedAt: '2026-01-01T00:00:00.000Z' },
          { id: 's2', weight: 100, reps: 8, completedAt: '2026-01-01T00:00:00.000Z' },
          { id: 's3', weight: 140, reps: 1, completedAt: null },
        ],
      },
    ]);

    expect(plan.templateUpdates).toEqual([
      { templateExerciseId: 'tpl-1', currentWeight: 102.5, targetReps: 5 },
    ]);
    expect(plan.personalRecords).toHaveLength(1);
    expect(plan.personalRecords[0]?.setId).toBe('s1');
  });
});

describe('analytics and time', () => {
  it('keeps the heaviest completed weight per session', () => {
    expect(
      bestWeightBySession([
        { sessionId: 'b', completedAt: '2026-02-02T00:00:00.000Z', weight: 80, reps: 5, setCompletedAt: '2026-02-02T00:00:00.000Z' },
        { sessionId: 'a', completedAt: '2026-01-01T00:00:00.000Z', weight: 70, reps: 5, setCompletedAt: '2026-01-01T00:00:00.000Z' },
        { sessionId: 'a', completedAt: '2026-01-01T00:00:00.000Z', weight: 90, reps: 3, setCompletedAt: null },
      ]),
    ).toEqual([
      { sessionId: 'a', completedAt: '2026-01-01T00:00:00.000Z', weight: 70 },
      { sessionId: 'b', completedAt: '2026-02-02T00:00:00.000Z', weight: 80 },
    ]);
  });

  it('formats a load and starts the week on Monday', () => {
    expect(formatLoad(62.5, 5)).toBe('62.5 kg × 5');
    const monday = startOfWeekIso(new Date('2026-10-28T18:00:00.000Z'));
    expect(new Date(monday).getDay()).toBe(1);
  });
});
