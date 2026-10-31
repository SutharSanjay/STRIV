import { redact } from '../../src/utils/logger';

describe('redact', () => {
  it('removes workout and credential fields before they can be logged', () => {
    expect(
      redact({
        errorName: 'MigrationError',
        weight: 100,
        reps: 5,
        note: 'easy',
        nested: {
          email: 'athlete@example.com',
          attempt: 1,
        },
      }),
    ).toEqual({
      errorName: 'MigrationError',
      weight: '[redacted]',
      reps: '[redacted]',
      note: '[redacted]',
      nested: {
        email: '[redacted]',
        attempt: 1,
      },
    });
  });
});
