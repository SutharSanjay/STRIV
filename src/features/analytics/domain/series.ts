export type PerformedSet = {
  sessionId: string;
  completedAt: string;
  weight: number | null;
  reps: number | null;
  setCompletedAt: string | null;
};

export type ChartPoint = {
  sessionId: string;
  completedAt: string;
  weight: number;
};

/** Best completed weight for each session, oldest first. */
export function bestWeightBySession(sets: readonly PerformedSet[]): ChartPoint[] {
  const best = new Map<string, ChartPoint>();

  for (const set of sets) {
    if (!set.setCompletedAt || set.weight === null || set.weight <= 0) {
      continue;
    }
    const current = best.get(set.sessionId);
    if (!current || set.weight > current.weight) {
      best.set(set.sessionId, {
        sessionId: set.sessionId,
        completedAt: set.completedAt,
        weight: set.weight,
      });
    }
  }

  return [...best.values()].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}
