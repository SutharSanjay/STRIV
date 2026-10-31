import { roundWeight } from './recommend';

/** Epley estimate. A single completed rep is the weight itself. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps < 1) {
    return 0;
  }
  if (reps === 1) {
    return roundWeight(weight);
  }
  return roundWeight(weight * (1 + reps / 30));
}

export type RecordCandidate = {
  setId: string;
  weight: number;
  reps: number;
};

export type PersonalRecordDraft = RecordCandidate & {
  estimatedOneRepMax: number;
};

/**
 * Returns a new record only when the best completed set beats the previous
 * best estimate. Ties do not create another record.
 */
export function selectPersonalRecord(
  sets: readonly RecordCandidate[],
  previousBest: number | null,
): PersonalRecordDraft | null {
  let best: PersonalRecordDraft | null = null;

  for (const set of sets) {
    const estimatedOneRepMax = estimateOneRepMax(set.weight, set.reps);
    if (estimatedOneRepMax <= 0) {
      continue;
    }
    if (
      !best ||
      estimatedOneRepMax > best.estimatedOneRepMax ||
      (estimatedOneRepMax === best.estimatedOneRepMax && set.weight > best.weight)
    ) {
      best = { ...set, estimatedOneRepMax };
    }
  }

  if (!best) {
    return null;
  }
  if (previousBest !== null && best.estimatedOneRepMax <= previousBest) {
    return null;
  }
  return best;
}
