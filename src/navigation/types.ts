export type TabParamList = {
  Today: undefined;
  Exercises: undefined;
  History: undefined;
  Progress: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Session: { sessionId: string };
  SessionDetail: { sessionId: string };
  Splits: undefined;
  SplitEditor: { splitId: string };
  Programs: undefined;
  ExerciseForm: { exerciseId?: string } | undefined;
  ExerciseProgress: { exerciseId: string };
  MeasurementForm: undefined;
};
