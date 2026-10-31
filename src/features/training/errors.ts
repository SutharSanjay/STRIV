import { InvalidPrescriptionError } from '../progression/domain/recommend';
import { ValidationError } from '../workouts/domain/validation';

export class TrainingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrainingError';
  }
}

export function visibleError(error: unknown, fallback: string): string {
  if (
    error instanceof TrainingError ||
    error instanceof ValidationError ||
    error instanceof InvalidPrescriptionError
  ) {
    return error.message;
  }
  return fallback;
}
