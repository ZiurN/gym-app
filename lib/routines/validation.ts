import type { Modality } from "@/lib/catalog/types";
import type {
  RoutineDayInput,
  RoutineExerciseInput,
  RoutineInput,
  RoutineIssue,
} from "./types";

export const ROUTINE_LIMITS = {
  nameMax: 80,
  daysMin: 1,
  daysMax: 7,
  exercisesPerDayMax: 30,
  setsMin: 1,
  setsMax: 10,
  restMin: 0,
  restMax: 600,
  repsMax: 999,
  noteMax: 280,
  supersetMin: 2,
  supersetMax: 4,
  routinesPerUser: 50,
} as const;

// Starting values so a new row is complete; not recommendations.
export const DEFAULT_TARGET_SETS = 3;
export const DEFAULT_REST_SECONDS = 90;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CatalogLookup = ReadonlyMap<string, { modality: Modality }>;

function isInt(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

function optionalText(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Turns untrusted input into a RoutineInput with names trimmed, or null when
 * its shape is wrong. Value rules are checked by validateRoutine.
 */
export function parseRoutineInput(raw: unknown): RoutineInput | null {
  if (typeof raw !== "object" || raw == null) return null;
  const { name, days } = raw as Record<string, unknown>;
  if (typeof name !== "string" || !Array.isArray(days)) return null;

  const parsedDays: RoutineDayInput[] = [];
  for (const day of days) {
    if (typeof day !== "object" || day == null) return null;
    const d = day as Record<string, unknown>;
    if (typeof d.id !== "string" || typeof d.name !== "string") return null;
    if (!Array.isArray(d.exercises)) return null;

    const exercises: RoutineExerciseInput[] = [];
    for (const exercise of d.exercises) {
      if (typeof exercise !== "object" || exercise == null) return null;
      const e = exercise as Record<string, unknown>;
      const note = optionalText(e.note);
      if (
        typeof e.id !== "string" ||
        typeof e.exerciseId !== "string" ||
        typeof e.targetSets !== "number" ||
        typeof e.restSeconds !== "number" ||
        (e.repMin != null && typeof e.repMin !== "number") ||
        (e.repMax != null && typeof e.repMax !== "number") ||
        (e.supersetGroup != null && typeof e.supersetGroup !== "number") ||
        (e.alternativeExerciseId != null &&
          typeof e.alternativeExerciseId !== "string") ||
        note === undefined
      ) {
        return null;
      }
      exercises.push({
        id: e.id,
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        restSeconds: e.restSeconds,
        repMin: (e.repMin as number | null | undefined) ?? null,
        repMax: (e.repMax as number | null | undefined) ?? null,
        note,
        supersetGroup: (e.supersetGroup as number | null | undefined) ?? null,
        alternativeExerciseId:
          (e.alternativeExerciseId as string | null | undefined) ?? null,
      });
    }
    parsedDays.push({ id: d.id, name: d.name.trim(), exercises });
  }
  return { name: name.trim(), days: parsedDays };
}

function validateSupersets(
  day: RoutineDayInput,
  dayIndex: number,
  issues: RoutineIssue[],
) {
  const members = new Map<number, number[]>();
  day.exercises.forEach((exercise, index) => {
    if (exercise.supersetGroup == null) return;
    members.set(exercise.supersetGroup, [
      ...(members.get(exercise.supersetGroup) ?? []),
      index,
    ]);
  });

  for (const indexes of members.values()) {
    const at = { dayIndex, exerciseIndex: indexes[0] };
    if (
      indexes.length < ROUTINE_LIMITS.supersetMin ||
      indexes.length > ROUTINE_LIMITS.supersetMax
    ) {
      issues.push({
        code: "superset_size",
        message: `A superset has ${ROUTINE_LIMITS.supersetMin} to ${ROUTINE_LIMITS.supersetMax} exercises.`,
        ...at,
      });
    }
    if (indexes.some((value, i) => i > 0 && value !== indexes[i - 1] + 1)) {
      issues.push({
        code: "superset_not_adjacent",
        message: "The exercises of a superset must be next to each other.",
        ...at,
      });
    }
    const rest = day.exercises[indexes[0]].restSeconds;
    if (indexes.some((i) => day.exercises[i].restSeconds !== rest)) {
      issues.push({
        code: "superset_rest",
        message: "A superset has a single rest time.",
        ...at,
      });
    }
  }
}

/** Every rule a routine must satisfy to be saved. Empty array = valid. */
export function validateRoutine(
  routine: RoutineInput,
  catalog: CatalogLookup,
): RoutineIssue[] {
  const L = ROUTINE_LIMITS;
  const issues: RoutineIssue[] = [];

  if (routine.name === "") {
    issues.push({ code: "name_required", message: "Give the routine a name." });
  } else if (routine.name.length > L.nameMax) {
    issues.push({
      code: "name_too_long",
      message: `The routine name can have up to ${L.nameMax} characters.`,
    });
  }
  if (routine.days.length < L.daysMin || routine.days.length > L.daysMax) {
    issues.push({
      code: "day_count",
      message: `A routine has ${L.daysMin} to ${L.daysMax} days.`,
    });
  }

  const ids = new Set<string>();
  const claimId = (id: string, at: Partial<RoutineIssue>) => {
    if (!UUID.test(id) || ids.has(id)) {
      issues.push({ code: "bad_id", message: "Invalid routine data.", ...at });
    }
    ids.add(id);
  };

  routine.days.forEach((day, dayIndex) => {
    claimId(day.id, { dayIndex });
    if (day.name === "") {
      issues.push({ code: "day_name_required", message: "Give the day a name.", dayIndex });
    } else if (day.name.length > L.nameMax) {
      issues.push({
        code: "day_name_too_long",
        message: `A day name can have up to ${L.nameMax} characters.`,
        dayIndex,
      });
    }
    if (day.exercises.length > L.exercisesPerDayMax) {
      issues.push({
        code: "too_many_exercises",
        message: `A day can have up to ${L.exercisesPerDayMax} exercises.`,
        dayIndex,
      });
    }

    const usedInDay = new Set<string>();
    const claimExercise = (exerciseId: string, at: Partial<RoutineIssue>) => {
      if (usedInDay.has(exerciseId)) {
        issues.push({
          code: "duplicate_exercise",
          message: "That exercise is already in this day.",
          ...at,
        });
      }
      usedInDay.add(exerciseId);
    };

    day.exercises.forEach((exercise, exerciseIndex) => {
      const at = { dayIndex, exerciseIndex };
      claimId(exercise.id, at);

      const main = catalog.get(exercise.exerciseId);
      if (!main) {
        issues.push({ code: "unknown_exercise", message: "That exercise is not in the catalog.", ...at });
      }
      claimExercise(exercise.exerciseId, at);

      if (exercise.alternativeExerciseId != null) {
        const alternative = catalog.get(exercise.alternativeExerciseId);
        if (!alternative) {
          issues.push({ code: "unknown_exercise", message: "That exercise is not in the catalog.", ...at });
        } else if (exercise.alternativeExerciseId === exercise.exerciseId) {
          issues.push({
            code: "alternative_same",
            message: "The alternative must be a different exercise.",
            ...at,
          });
        } else if (main && alternative.modality !== main.modality) {
          issues.push({
            code: "alternative_modality",
            message: "The alternative must be logged the same way as the exercise.",
            ...at,
          });
        }
        if (exercise.alternativeExerciseId !== exercise.exerciseId) {
          claimExercise(exercise.alternativeExerciseId, at);
        }
      }

      if (!isInt(exercise.targetSets, L.setsMin, L.setsMax)) {
        issues.push({
          code: "sets_range",
          message: `Sets must be between ${L.setsMin} and ${L.setsMax}.`,
          ...at,
        });
      }
      if (!isInt(exercise.restSeconds, L.restMin, L.restMax)) {
        issues.push({
          code: "rest_range",
          message: `Rest must be between ${L.restMin} and ${L.restMax} seconds.`,
          ...at,
        });
      }
      for (const reps of [exercise.repMin, exercise.repMax]) {
        if (reps != null && !isInt(reps, 1, L.repsMax)) {
          issues.push({
            code: "reps_range",
            message: `Reps must be between 1 and ${L.repsMax}.`,
            ...at,
          });
          break;
        }
      }
      if (
        exercise.repMin != null &&
        exercise.repMax != null &&
        exercise.repMin > exercise.repMax
      ) {
        issues.push({
          code: "reps_order",
          message: "The lower rep target cannot be above the upper one.",
          ...at,
        });
      }
      if (exercise.note != null && exercise.note.length > L.noteMax) {
        issues.push({
          code: "note_too_long",
          message: `A note can have up to ${L.noteMax} characters.`,
          ...at,
        });
      }
      if (exercise.supersetGroup != null && !isInt(exercise.supersetGroup, 1, 1000)) {
        issues.push({ code: "bad_id", message: "Invalid routine data.", ...at });
      }
    });

    validateSupersets(day, dayIndex, issues);
  });

  return issues;
}

/** Names of the days that have no exercises; a routine with any cannot be activated. */
export function emptyDayNames(routine: RoutineInput): string[] {
  return routine.days
    .filter((day) => day.exercises.length === 0)
    .map((day) => day.name);
}
