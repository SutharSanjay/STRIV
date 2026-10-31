import { roundWeight } from '../../progression/domain/recommend';

export function formatWeight(weight: number): string {
  const rounded = roundWeight(weight);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatLoad(weight: number, reps: number): string {
  return `${formatWeight(weight)} kg × ${reps}`;
}

export function formatSetSummary(
  sets: readonly { weight: number; reps: number }[],
): string {
  if (sets.length === 0) {
    return 'No completed sets';
  }
  return sets.map(set => formatLoad(set.weight, set.reps)).join(', ');
}
