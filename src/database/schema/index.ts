import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const appMetadata = sqliteTable('app_metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const muscleGroups = sqliteTable(
  'muscle_groups',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
  },
  table => [uniqueIndex('muscle_groups_name_idx').on(table.name)],
);

export const equipment = sqliteTable(
  'equipment',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
  },
  table => [uniqueIndex('equipment_name_idx').on(table.name)],
);

export const exercises = sqliteTable(
  'exercises',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    muscleGroupId: text('muscle_group_id').references(() => muscleGroups.id),
    equipmentId: text('equipment_id').references(() => equipment.id),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  table => [index('exercises_name_idx').on(table.name), index('exercises_deleted_idx').on(table.deletedAt)],
);

export const splits = sqliteTable(
  'splits',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    isPreset: integer('is_preset', { mode: 'boolean' }).notNull().default(false),
    sourcePresetId: text('source_preset_id'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    archivedAt: text('archived_at'),
  },
  table => [index('splits_preset_idx').on(table.isPreset, table.archivedAt)],
);

export const splitDays = sqliteTable(
  'split_days',
  {
    id: text('id').primaryKey(),
    splitId: text('split_id')
      .notNull()
      .references(() => splits.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    weekday: integer('weekday'),
  },
  table => [
    index('split_days_split_idx').on(table.splitId, table.position),
    index('split_days_weekday_idx').on(table.splitId, table.weekday),
  ],
);

export const templateExercises = sqliteTable(
  'template_exercises',
  {
    id: text('id').primaryKey(),
    splitDayId: text('split_day_id')
      .notNull()
      .references(() => splitDays.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    targetSets: integer('target_sets').notNull(),
    repMin: integer('rep_min').notNull(),
    repMax: integer('rep_max').notNull(),
    targetReps: integer('target_reps').notNull(),
    currentWeight: real('current_weight').notNull(),
    increment: real('increment').notNull(),
  },
  table => [index('template_exercises_day_idx').on(table.splitDayId, table.position)],
);

export const workoutSessions = sqliteTable(
  'workout_sessions',
  {
    id: text('id').primaryKey(),
    status: text('status').notNull(),
    splitId: text('split_id'),
    splitName: text('split_name').notNull(),
    splitDayId: text('split_day_id'),
    splitDayName: text('split_day_name').notNull(),
    startedAt: text('started_at').notNull(),
    completedAt: text('completed_at'),
    updatedAt: text('updated_at').notNull(),
  },
  table => [
    index('sessions_status_started_idx').on(table.status, table.startedAt),
    index('sessions_completed_idx').on(table.completedAt),
    check(
      'sessions_status_check',
      sql`${table.status} in ('in_progress', 'completed', 'abandoned')`,
    ),
  ],
);

export const sessionExercises = sqliteTable(
  'session_exercises',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    exerciseId: text('exercise_id').references(() => exercises.id, {
      onDelete: 'set null',
    }),
    exerciseName: text('exercise_name').notNull(),
    muscleGroupName: text('muscle_group_name'),
    equipmentName: text('equipment_name'),
    targetSets: integer('target_sets').notNull(),
    repMin: integer('rep_min').notNull(),
    repMax: integer('rep_max').notNull(),
    prescribedWeight: real('prescribed_weight').notNull(),
    prescribedReps: integer('prescribed_reps').notNull(),
    increment: real('increment').notNull(),
    templateExerciseId: text('template_exercise_id'),
    recommendationReason: text('recommendation_reason').notNull(),
  },
  table => [
    index('session_exercises_session_idx').on(table.sessionId, table.position),
    index('session_exercises_exercise_idx').on(table.exerciseId),
  ],
);

export const exerciseSets = sqliteTable(
  'exercise_sets',
  {
    id: text('id').primaryKey(),
    sessionExerciseId: text('session_exercise_id')
      .notNull()
      .references(() => sessionExercises.id, { onDelete: 'cascade' }),
    setIndex: integer('set_index').notNull(),
    weight: real('weight'),
    reps: integer('reps'),
    completedAt: text('completed_at'),
  },
  table => [index('exercise_sets_exercise_idx').on(table.sessionExerciseId, table.setIndex)],
);

export const personalRecords = sqliteTable(
  'personal_records',
  {
    id: text('id').primaryKey(),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    weight: real('weight').notNull(),
    reps: integer('reps').notNull(),
    estimatedOneRepMax: real('estimated_one_rep_max').notNull(),
    achievedAt: text('achieved_at').notNull(),
    sessionId: text('session_id').notNull(),
    setId: text('set_id').notNull(),
  },
  table => [index('personal_records_exercise_idx').on(table.exerciseId, table.achievedAt)],
);

export const bodyMeasurements = sqliteTable(
  'body_measurements',
  {
    id: text('id').primaryKey(),
    metric: text('metric').notNull(),
    value: real('value').notNull(),
    unit: text('unit').notNull(),
    measuredAt: text('measured_at').notNull(),
  },
  table => [index('body_measurements_metric_idx').on(table.metric, table.measuredAt)],
);
