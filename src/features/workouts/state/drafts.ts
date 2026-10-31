import { create } from 'zustand';

export type SetDraft = {
  weight: string;
  reps: string;
};

type DraftState = {
  values: Record<string, SetDraft>;
  setField: (setId: string, field: keyof SetDraft, value: string) => void;
  hydrate: (setId: string, draft: SetDraft) => void;
};

export const useDraftStore = create<DraftState>(set => ({
  values: {},
  setField: (setId, field, value) =>
    set(state => ({
      values: {
        ...state.values,
        [setId]: {
          weight: state.values[setId]?.weight ?? '',
          reps: state.values[setId]?.reps ?? '',
          [field]: value,
        },
      },
    })),
  hydrate: (setId, draft) =>
    set(state => {
      if (state.values[setId]) {
        return state;
      }
      return { values: { ...state.values, [setId]: draft } };
    }),
}));
