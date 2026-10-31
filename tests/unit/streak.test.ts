import { sessionStreak, trainingMessage } from '../../src/features/analytics/domain/streak';

function at(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour).toISOString();
}

describe('sessionStreak', () => {
  const now = new Date(2026, 9, 28, 18);

  it('keeps the run through rest days and leaves today open', () => {
    expect(now.getDay()).toBe(3);
    expect(
      sessionStreak({
        completedAt: [at(2026, 10, 26), at(2026, 10, 23)],
        scheduledWeekdays: [1, 3, 5],
        rotationLength: 3,
        now,
      }),
    ).toBe(2);
  });

  it('stops at a missed training day', () => {
    expect(
      sessionStreak({
        completedAt: [at(2026, 10, 23)],
        scheduledWeekdays: [1, 3, 5],
        rotationLength: 3,
        now,
      }),
    ).toBe(0);
  });

  it('counts today once the session is finished', () => {
    expect(
      sessionStreak({
        completedAt: [at(2026, 10, 28), at(2026, 10, 26), at(2026, 10, 23)],
        scheduledWeekdays: [1, 3, 5],
        rotationLength: 3,
        now,
      }),
    ).toBe(3);
  });

  it('keeps a missed Sunday from breaking a weekday run', () => {
    const monday = new Date(2026, 10, 2, 18);
    expect(monday.getDay()).toBe(1);
    expect(
      sessionStreak({
        completedAt: [at(2026, 10, 30), at(2026, 10, 28), at(2026, 10, 26)],
        scheduledWeekdays: [0, 1, 3, 5],
        rotationLength: 4,
        now: monday,
      }),
    ).toBe(3);
  });

  it('treats Sunday as rest between rotation sessions', () => {
    const monday = new Date(2026, 10, 2, 18);
    expect(
      sessionStreak({
        completedAt: [at(2026, 10, 31)],
        scheduledWeekdays: null,
        rotationLength: 1,
        now: monday,
      }),
    ).toBe(1);
  });

  it('breaks a rotation when the gap is longer than the split', () => {
    expect(
      sessionStreak({
        completedAt: [at(2026, 10, 20), at(2026, 10, 18)],
        scheduledWeekdays: null,
        rotationLength: 3,
        now,
      }),
    ).toBe(0);
    expect(
      sessionStreak({
        completedAt: [at(2026, 10, 26), at(2026, 10, 23)],
        scheduledWeekdays: null,
        rotationLength: 3,
        now,
      }),
    ).toBe(2);
  });
});

describe('trainingMessage', () => {
  it('states the streak without inventing a session', () => {
    expect(trainingMessage({ streak: 0, todayFinished: false, recordsThisWeek: 0 })).toMatch(/starts at one/);
    expect(trainingMessage({ streak: 4, todayFinished: true, recordsThisWeek: 0 })).toBe(
      '4 sessions in a row. Today kept it.',
    );
    expect(trainingMessage({ streak: 2, todayFinished: false, recordsThisWeek: 1 })).toMatch(/record landed/);
  });
});
