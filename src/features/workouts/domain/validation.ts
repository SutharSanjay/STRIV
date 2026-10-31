const NAME_MAX = 60;
const WEIGHT_MAX = 500;
const REPS_MAX = 50;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateName(value: string, label: string): string {
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > NAME_MAX) {
    throw new ValidationError(`${label} must be 1 to ${NAME_MAX} characters.`);
  }
  return name;
}

export function parseWeight(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized.length === 0) {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const weight = Number(normalized);
  if (!Number.isFinite(weight) || weight > WEIGHT_MAX) {
    return null;
  }
  return weight;
}

export function parseReps(input: string): number | null {
  const normalized = input.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }
  const reps = Number(normalized);
  if (!Number.isInteger(reps) || reps < 1 || reps > REPS_MAX) {
    return null;
  }
  return reps;
}

export function parseBodyWeight(input: string): number | null {
  const weight = parseWeight(input);
  if (weight === null || weight <= 0) {
    return null;
  }
  return weight;
}

export function validatePrescriptionNumbers(input: {
  targetSets: number;
  repMin: number;
  repMax: number;
  weight: number;
  increment: number;
}): void {
  if (!Number.isInteger(input.targetSets) || input.targetSets < 1 || input.targetSets > 10) {
    throw new ValidationError('Working sets must be a whole number from 1 to 10.');
  }
  if (
    !Number.isInteger(input.repMin) ||
    !Number.isInteger(input.repMax) ||
    input.repMin < 1 ||
    input.repMax > REPS_MAX ||
    input.repMax < input.repMin
  ) {
    throw new ValidationError('The rep range must be whole numbers, with the minimum at or below the maximum.');
  }
  if (!Number.isFinite(input.weight) || input.weight < 0 || input.weight > WEIGHT_MAX) {
    throw new ValidationError('Weight must be between 0 and 500 kg.');
  }
  if (!Number.isFinite(input.increment) || input.increment < 0 || input.increment > 50) {
    throw new ValidationError('The weight increment must be between 0 and 50 kg.');
  }
}
