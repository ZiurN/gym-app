import type { RoutineDayInput, RoutineExerciseInput, RoutineInput } from "./types";
import {
  DEFAULT_REST_SECONDS,
  DEFAULT_TARGET_SETS,
  ROUTINE_LIMITS,
} from "./validation";

/** Pure edits of a routine being built. Each returns a new value. */

export type Block = {
  /** Superset number, or null for a single exercise. */
  group: number | null;
  exercises: RoutineExerciseInput[];
};

/** A day's exercises as the blocks that move together. */
export function blocksOf(day: RoutineDayInput): Block[] {
  const blocks: Block[] = [];
  for (const exercise of day.exercises) {
    const last = blocks.at(-1);
    if (exercise.supersetGroup != null && last?.group === exercise.supersetGroup) {
      last.exercises.push(exercise);
    } else {
      blocks.push({ group: exercise.supersetGroup, exercises: [exercise] });
    }
  }
  return blocks;
}

const flatten = (blocks: Block[]) => blocks.flatMap((block) => block.exercises);

export function newDay(position: number, newId: () => string): RoutineDayInput {
  return { id: newId(), name: `Day ${position + 1}`, exercises: [] };
}

export function newRoutineDraft(dayCount: number, newId: () => string): RoutineInput {
  return {
    name: "",
    days: Array.from({ length: dayCount }, (_, index) => newDay(index, newId)),
  };
}

export function addDay(routine: RoutineInput, newId: () => string): RoutineInput {
  if (routine.days.length >= ROUTINE_LIMITS.daysMax) return routine;
  return { ...routine, days: [...routine.days, newDay(routine.days.length, newId)] };
}

export function removeDay(routine: RoutineInput, dayId: string): RoutineInput {
  if (routine.days.length <= ROUTINE_LIMITS.daysMin) return routine;
  return { ...routine, days: routine.days.filter((day) => day.id !== dayId) };
}

export function moveDay(routine: RoutineInput, dayId: string, by: -1 | 1): RoutineInput {
  const from = routine.days.findIndex((day) => day.id === dayId);
  const to = from + by;
  if (from < 0 || to < 0 || to >= routine.days.length) return routine;
  const days = [...routine.days];
  [days[from], days[to]] = [days[to], days[from]];
  return { ...routine, days };
}

export function updateDay(
  routine: RoutineInput,
  dayId: string,
  change: (day: RoutineDayInput) => RoutineDayInput,
): RoutineInput {
  return {
    ...routine,
    days: routine.days.map((day) => (day.id === dayId ? change(day) : day)),
  };
}

/** Exercise ids a day already uses, alternatives included. */
export function exerciseIdsInDay(day: RoutineDayInput): Set<string> {
  return new Set(
    day.exercises.flatMap((exercise) =>
      exercise.alternativeExerciseId
        ? [exercise.exerciseId, exercise.alternativeExerciseId]
        : [exercise.exerciseId],
    ),
  );
}

export function addExercise(
  day: RoutineDayInput,
  exerciseId: string,
  newId: () => string,
): RoutineDayInput {
  if (
    exerciseIdsInDay(day).has(exerciseId) ||
    day.exercises.length >= ROUTINE_LIMITS.exercisesPerDayMax
  ) {
    return day;
  }
  return {
    ...day,
    exercises: [
      ...day.exercises,
      {
        id: newId(),
        exerciseId,
        targetSets: DEFAULT_TARGET_SETS,
        restSeconds: DEFAULT_REST_SECONDS,
        repMin: null,
        repMax: null,
        note: null,
        supersetGroup: null,
        alternativeExerciseId: null,
      },
    ],
  };
}

export function updateExercise(
  day: RoutineDayInput,
  rowId: string,
  patch: Partial<RoutineExerciseInput>,
): RoutineDayInput {
  return {
    ...day,
    exercises: day.exercises.map((exercise) =>
      exercise.id === rowId ? { ...exercise, ...patch } : exercise,
    ),
  };
}

/** Removes one exercise; a superset left with a single exercise is dissolved. */
export function removeExercise(day: RoutineDayInput, rowId: string): RoutineDayInput {
  const blocks = blocksOf(day)
    .map((block) => ({
      ...block,
      exercises: block.exercises.filter((exercise) => exercise.id !== rowId),
    }))
    .filter((block) => block.exercises.length > 0)
    .map((block) =>
      block.group != null && block.exercises.length < ROUTINE_LIMITS.supersetMin
        ? { group: null, exercises: block.exercises.map((e) => ({ ...e, supersetGroup: null })) }
        : block,
    );
  return { ...day, exercises: flatten(blocks) };
}

/** Moves the block holding the exercise; a superset moves as a whole. */
export function moveBlock(day: RoutineDayInput, rowId: string, by: -1 | 1): RoutineDayInput {
  const blocks = blocksOf(day);
  const from = blocks.findIndex((block) => block.exercises.some((e) => e.id === rowId));
  const to = from + by;
  if (from < 0 || to < 0 || to >= blocks.length) return day;
  [blocks[from], blocks[to]] = [blocks[to], blocks[from]];
  return { ...day, exercises: flatten(blocks) };
}

/**
 * Whether the block holding the exercise can take in the exercise after it:
 * the next block must be a single exercise and the result at most 4.
 */
export function canGroupWithNext(day: RoutineDayInput, rowId: string): boolean {
  const blocks = blocksOf(day);
  const index = blocks.findIndex((block) => block.exercises.some((e) => e.id === rowId));
  const next = blocks[index + 1];
  return (
    index >= 0 &&
    next != null &&
    next.group == null &&
    blocks[index].exercises.length < ROUTINE_LIMITS.supersetMax
  );
}

/** Groups the exercise (or its superset) with the next one; the group shares one rest time. */
export function groupWithNext(day: RoutineDayInput, rowId: string): RoutineDayInput {
  if (!canGroupWithNext(day, rowId)) return day;
  const blocks = blocksOf(day);
  const index = blocks.findIndex((block) => block.exercises.some((e) => e.id === rowId));
  const group =
    blocks[index].group ??
    Math.max(0, ...day.exercises.map((exercise) => exercise.supersetGroup ?? 0)) + 1;
  const restSeconds = blocks[index].exercises[0].restSeconds;
  const merged: Block = {
    group,
    exercises: [...blocks[index].exercises, ...blocks[index + 1].exercises].map((exercise) => ({
      ...exercise,
      supersetGroup: group,
      restSeconds,
    })),
  };
  blocks.splice(index, 2, merged);
  return { ...day, exercises: flatten(blocks) };
}

/** Splits a superset back into single exercises, each keeping its rest time. */
export function ungroup(day: RoutineDayInput, group: number): RoutineDayInput {
  return {
    ...day,
    exercises: day.exercises.map((exercise) =>
      exercise.supersetGroup === group ? { ...exercise, supersetGroup: null } : exercise,
    ),
  };
}

export function removeGroup(day: RoutineDayInput, group: number): RoutineDayInput {
  return {
    ...day,
    exercises: day.exercises.filter((exercise) => exercise.supersetGroup !== group),
  };
}

export function setGroupRest(
  day: RoutineDayInput,
  group: number,
  restSeconds: number,
): RoutineDayInput {
  return {
    ...day,
    exercises: day.exercises.map((exercise) =>
      exercise.supersetGroup === group ? { ...exercise, restSeconds } : exercise,
    ),
  };
}

/** Supersets that exist in stored data, per day; these are the fixed ones. */
export function savedSupersetsOf(routine: RoutineInput): Record<string, number[]> {
  return Object.fromEntries(
    routine.days.map((day) => [
      day.id,
      [...new Set(day.exercises.flatMap((e) => (e.supersetGroup == null ? [] : [e.supersetGroup])))],
    ]),
  );
}

export function describeTargets(exercise: RoutineExerciseInput, inSuperset: boolean): string {
  const parts = [`${exercise.targetSets} ${exercise.targetSets === 1 ? "set" : "sets"}`];
  const { repMin, repMax } = exercise;
  if (repMin != null && repMax != null) {
    parts.push(repMin === repMax ? `${repMin} reps` : `${repMin}–${repMax} reps`);
  } else if (repMin != null) {
    parts.push(`${repMin}+ reps`);
  } else if (repMax != null) {
    parts.push(`up to ${repMax} reps`);
  }
  if (!inSuperset) parts.push(`rest ${exercise.restSeconds} s`);
  return parts.join(" · ");
}
