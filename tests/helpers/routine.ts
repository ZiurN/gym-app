import { randomUUID } from "node:crypto";
import type {
  RoutineDayInput,
  RoutineExerciseInput,
  RoutineInput,
} from "@/lib/routines/types";

export function exercise(
  exerciseId: string,
  overrides: Partial<RoutineExerciseInput> = {},
): RoutineExerciseInput {
  return {
    id: randomUUID(),
    exerciseId,
    targetSets: 3,
    restSeconds: 90,
    repMin: null,
    repMax: null,
    note: null,
    supersetGroup: null,
    alternativeExerciseId: null,
    ...overrides,
  };
}

export function day(name: string, exercises: RoutineExerciseInput[] = []): RoutineDayInput {
  return { id: randomUUID(), name, exercises };
}

export function routine(days: RoutineDayInput[], name = "Upper/Lower"): RoutineInput {
  return { name, days };
}
