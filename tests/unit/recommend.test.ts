import {
  InvalidPrescriptionError,
  recommendNextSession,
  type Prescription,
} from '../../src/features/progression/domain/recommend';

const base: Prescription = {
  repMin: 5,
  repMax: 8,
  targetSets: 3,
  currentWeight: 60,
  increment: 2.5,
};

const done = (reps: number, weight = 60) => ({
  weight,
  reps,
  completed: true,
});

describe('recommendNextSession', () => {
  it('holds the weight when nothing was logged', () => {
    const result = recommendNextSession(base, []);
    expect(result.action).toBe('hold');
    expect(result.weight).toBe(60);
    expect(result.reps).toBe(5);
    expect(result.reason).toMatch(/No completed sets/);
  });

  it('ignores sets that were not explicitly completed', () => {
    const result = recommendNextSession(base, [
      { weight: 60, reps: 8, completed: false },
      { weight: 60, reps: 8, completed: false },
      { weight: 60, reps: 8, completed: false },
    ]);
    expect(result.action).toBe('hold');
    expect(result.reps).toBe(5);
  });

  it('does not increase when a required set is missing', () => {
    const result = recommendNextSession(base, [done(8), done(8)]);
    expect(result.action).toBe('hold');
    expect(result.reason).toMatch(/2 of 3/);
  });

  it('adds weight when every required set hits the top of the range', () => {
    const result = recommendNextSession(base, [done(8), done(9), done(8), done(3)]);
    expect(result).toMatchObject({
      action: 'increase_weight',
      weight: 62.5,
      reps: 5,
    });
    expect(result.reason).toMatch(/adds 2.5 kg/);
  });

  it('builds reps when every set is inside the range', () => {
    const result = recommendNextSession(base, [done(6), done(5), done(7)]);
    expect(result).toMatchObject({
      action: 'increase_reps',
      weight: 60,
      reps: 6,
    });
  });

  it('does not increase after a lighter or shorter set', () => {
    expect(recommendNextSession(base, [done(8), done(4), done(8)]).action).toBe('hold');
    expect(recommendNextSession(base, [done(8, 55), done(8), done(8)]).action).toBe('hold');
  });

  it('stays at the top when no increment is configured', () => {
    const result = recommendNextSession(
      { ...base, increment: 0 },
      [done(8), done(8), done(8)],
    );
    expect(result).toMatchObject({ action: 'hold', weight: 60, reps: 8 });
    expect(result.reason).toMatch(/No weight increment/);
  });

  it('rejects an inverted rep range', () => {
    expect(() => recommendNextSession({ ...base, repMin: 8, repMax: 5 }, [])).toThrow(
      InvalidPrescriptionError,
    );
  });
});
