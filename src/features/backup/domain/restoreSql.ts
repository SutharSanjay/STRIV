const DELETE_ORDER = [
  'exercise_sets',
  'session_exercises',
  'personal_records',
  'workout_sessions',
  'template_exercises',
  'split_days',
  'splits',
  'body_measurements',
  'exercises',
  'equipment',
  'muscle_groups',
  'app_metadata',
  '__drizzle_migrations',
] as const;

const INSERT_ORDER = [
  '__drizzle_migrations',
  'app_metadata',
  'muscle_groups',
  'equipment',
  'exercises',
  'splits',
  'split_days',
  'template_exercises',
  'workout_sessions',
  'session_exercises',
  'exercise_sets',
  'personal_records',
  'body_measurements',
] as const;

export function restoreStatements(): string[] {
  return [
    ...DELETE_ORDER.map(table => `DELETE FROM "${table}"`),
    ...INSERT_ORDER.map(
      table => `INSERT INTO "${table}" SELECT * FROM incoming."${table}"`,
    ),
  ];
}
