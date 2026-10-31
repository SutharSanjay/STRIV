import {
  recommendNextSession,
  type LoggedSet,
} from '../../progression/domain/recommend';
import {
  selectPersonalRecord,
  type PersonalRecordDraft,
} from '../../progression/domain/records';

export type CompletionSet = {
  id: string;
  weight: number | null;
  reps: number | null;
  completedAt: string | null;
};

export type CompletionExercise = {
  exerciseId: string | null;
  templateExerciseId: string | null;
  repMin: number;
  repMax: number;
  targetSets: number;
  prescribedWeight: number;
  increment: number;
  previousBestE1rm: number | null;
  sets: readonly CompletionSet[];
};

export type TemplateUpdate = {
  templateExerciseId: string;
  currentWeight: number;
  targetReps: number;
};

export type CompletionPlan = {
  templateUpdates: TemplateUpdate[];
  personalRecords: Array<PersonalRecordDraft & { exerciseId: string }>;
};

function loggedSets(sets: readonly CompletionSet[]): LoggedSet[] {
  return sets.flatMap(set => {
    if (!set.completedAt || set.weight === null || set.reps === null) {
      return [];
    }
    return [{ weight: set.weight, reps: set.reps, completed: true }];
  });
}

export function planCompletion(
  exercises: readonly CompletionExercise[],
): CompletionPlan {
  const templateUpdates: TemplateUpdate[] = [];
  const personalRecords: CompletionPlan['personalRecords'] = [];

  for (const exercise of exercises) {
    const completed = loggedSets(exercise.sets);
    const next = recommendNextSession(
      {
        repMin: exercise.repMin,
        repMax: exercise.repMax,
        targetSets: exercise.targetSets,
        currentWeight: exercise.prescribedWeight,
        increment: exercise.increment,
      },
      completed,
    );

    if (exercise.templateExerciseId) {
      templateUpdates.push({
        templateExerciseId: exercise.templateExerciseId,
        currentWeight: next.weight,
        targetReps: next.reps,
      });
    }

    if (!exercise.exerciseId) {
      continue;
    }

    const candidates = exercise.sets.flatMap(set => {
      if (!set.completedAt || set.weight === null || set.reps === null) {
        return [];
      }
      return [{ setId: set.id, weight: set.weight, reps: set.reps }];
    });
    const record = selectPersonalRecord(candidates, exercise.previousBestE1rm);
    if (record) {
      personalRecords.push({ ...record, exerciseId: exercise.exerciseId });
    }
  }

  return { templateUpdates, personalRecords };
}

export function countCompletedSets(exercises: readonly CompletionExercise[]): number {
  return exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter(set => set.completedAt !== null).length,
    0,
  );
}
