import type { RoutineInput, RoutineIssue } from "./types";

export type DayRow = { id: string; name: string; position: number };

export type ExerciseRow = {
  id: string;
  routineDayId: string;
  exerciseId: string;
  position: number;
  targetSets: number;
  restSeconds: number;
  repMin: number | null;
  repMax: number | null;
  note: string | null;
  supersetGroup: number | null;
  alternativeExerciseId: string | null;
};

export type ReconcilePlan = {
  issues: RoutineIssue[];
  days: { insert: DayRow[]; update: DayRow[]; deleteIds: string[] };
  exercises: { insert: ExerciseRow[]; update: ExerciseRow[]; deleteIds: string[] };
};

/**
 * Compares a submitted routine with what is stored, by id, and returns the
 * writes that turn one into the other. Ids of kept days and exercises are
 * preserved so past sessions keep pointing at the right day.
 *
 * A stored superset counts as saved: it must come back with exactly the same
 * exercises, still grouped and in the same order, or not at all.
 */
export function reconcileRoutine(
  stored: RoutineInput,
  submitted: RoutineInput,
): ReconcilePlan {
  const issues: RoutineIssue[] = [];
  const storedDayIds = new Set(stored.days.map((day) => day.id));
  const storedExercises = new Map(
    stored.days.flatMap((day) =>
      day.exercises.map((exercise) => [exercise.id, { dayId: day.id, exercise }] as const),
    ),
  );

  const days: ReconcilePlan["days"] = { insert: [], update: [], deleteIds: [] };
  const exercises: ReconcilePlan["exercises"] = { insert: [], update: [], deleteIds: [] };
  const submittedExerciseIds = new Set<string>();

  submitted.days.forEach((day, dayIndex) => {
    const dayRow = { id: day.id, name: day.name, position: dayIndex };
    (storedDayIds.has(day.id) ? days.update : days.insert).push(dayRow);

    day.exercises.forEach((exercise, exerciseIndex) => {
      submittedExerciseIds.add(exercise.id);
      const row: ExerciseRow = {
        id: exercise.id,
        routineDayId: day.id,
        exerciseId: exercise.exerciseId,
        position: exerciseIndex,
        targetSets: exercise.targetSets,
        restSeconds: exercise.restSeconds,
        repMin: exercise.repMin,
        repMax: exercise.repMax,
        note: exercise.note,
        supersetGroup: exercise.supersetGroup,
        alternativeExerciseId: exercise.alternativeExerciseId,
      };
      const before = storedExercises.get(exercise.id);
      if (!before) {
        exercises.insert.push(row);
        return;
      }
      if (before.dayId !== day.id || before.exercise.exerciseId !== exercise.exerciseId) {
        issues.push({
          code: "exercise_replaced",
          message: "Remove the exercise and add it again to change it or move it to another day.",
          dayIndex,
          exerciseIndex,
        });
      }
      exercises.update.push(row);
    });
  });

  const submittedDayIds = new Set(submitted.days.map((day) => day.id));
  days.deleteIds = stored.days
    .filter((day) => !submittedDayIds.has(day.id))
    .map((day) => day.id);
  exercises.deleteIds = [...storedExercises.keys()].filter(
    (id) => !submittedExerciseIds.has(id),
  );

  for (const storedDay of stored.days) {
    const groups = new Map<number, string[]>();
    for (const exercise of storedDay.exercises) {
      if (exercise.supersetGroup == null) continue;
      groups.set(exercise.supersetGroup, [
        ...(groups.get(exercise.supersetGroup) ?? []),
        exercise.id,
      ]);
    }
    const dayIndex = submitted.days.findIndex((day) => day.id === storedDay.id);
    const after = dayIndex >= 0 ? submitted.days[dayIndex].exercises : [];

    for (const memberIds of groups.values()) {
      const kept = memberIds.filter((id) => submittedExerciseIds.has(id));
      if (kept.length === 0) continue; // removed whole

      const group = after.find((exercise) => exercise.id === memberIds[0])?.supersetGroup;
      const nowGrouped =
        group == null
          ? []
          : after.filter((e) => e.supersetGroup === group).map((e) => e.id);
      const unchanged =
        nowGrouped.length === memberIds.length &&
        nowGrouped.every((id, index) => id === memberIds[index]);
      if (!unchanged) {
        issues.push({
          code: "saved_superset_changed",
          message:
            "A saved superset keeps its exercises. Duplicate the routine to change the grouping.",
          dayIndex: dayIndex >= 0 ? dayIndex : undefined,
        });
      }
    }
  }

  return { issues, days, exercises };
}
