export type LoggedSet = {
  weight: number;
  reps: number;
  completed: boolean;
};

export type Prescription = {
  repMin: number;
  repMax: number;
  targetSets: number;
  currentWeight: number;
  increment: number;
};

export type RecommendationAction = 'increase_weight' | 'increase_reps' | 'hold';

export type Recommendation = {
  weight: number;
  reps: number;
  action: RecommendationAction;
  reason: string;
};

export class InvalidPrescriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPrescriptionError';
  }
}

export function roundWeight(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function formatKg(value: number): string {
  const rounded = roundWeight(value);
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${text} kg`;
}

/**
 * Double progression.
 * Only sets marked completed count. The first `targetSets` completed sets are
 * the required working sets. Weight increases only when every required set
 * reaches the top of the rep range at or above the prescribed weight.
 */
export function recommendNextSession(
  prescription: Prescription,
  loggedSets: readonly LoggedSet[],
): Recommendation {
  const { repMin, repMax, targetSets, currentWeight, increment } = prescription;

  if (
    !Number.isInteger(repMin) ||
    !Number.isInteger(repMax) ||
    !Number.isInteger(targetSets)
  ) {
    throw new InvalidPrescriptionError(
      'Rep targets and the set count must be whole numbers.',
    );
  }
  if (repMin < 1 || repMax < repMin || targetSets < 1) {
    throw new InvalidPrescriptionError('The rep range or set count is invalid.');
  }
  if (!Number.isFinite(currentWeight) || currentWeight < 0) {
    throw new InvalidPrescriptionError('The working weight is invalid.');
  }
  if (!Number.isFinite(increment) || increment < 0) {
    throw new InvalidPrescriptionError('The weight increment is invalid.');
  }

  const completed = loggedSets.filter(set => set.completed);
  const required = completed.slice(0, targetSets);
  const hold = (reps: number, reason: string): Recommendation => ({
    weight: currentWeight,
    reps,
    action: 'hold',
    reason,
  });

  if (required.length < targetSets) {
    return hold(
      repMin,
      required.length === 0
        ? 'No completed sets were logged, so the weight stays the same and the target is the bottom of the rep range.'
        : `Only ${required.length} of ${targetSets} working sets were logged, so the weight does not increase.`,
    );
  }

  const belowPrescription = required.some(
    set => set.weight < currentWeight || set.reps < repMin,
  );
  if (belowPrescription) {
    return hold(
      repMin,
      'Performance was below the prescribed weight or the bottom of the rep range, so the weight does not increase.',
    );
  }

  const reachedTop = required.every(
    set => set.reps >= repMax && set.weight >= currentWeight,
  );
  if (reachedTop) {
    if (increment === 0) {
      return hold(
        repMax,
        'Every required set hit the top of the rep range. No weight increment is configured, so the target stays there.',
      );
    }
    const nextWeight = roundWeight(currentWeight + increment);
    return {
      weight: nextWeight,
      reps: repMin,
      action: 'increase_weight',
      reason: `Every required set reached ${repMax} reps at ${formatKg(currentWeight)}, so the next session adds ${formatKg(increment)} and starts at ${repMin} reps.`,
    };
  }

  const lowestReps = Math.min(...required.map(set => set.reps));
  const nextReps = Math.min(Math.max(lowestReps + 1, repMin), repMax);
  return {
    weight: currentWeight,
    reps: nextReps,
    action: 'increase_reps',
    reason: `All required sets were inside the rep range. Stay at ${formatKg(currentWeight)} and aim for ${nextReps} reps.`,
  };
}
