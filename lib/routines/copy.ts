import type { RoutineInput } from "./types";
import { ROUTINE_LIMITS } from "./validation";

const COPY_SUFFIX = " (copy)";

export function copyName(name: string): string {
  const room = ROUTINE_LIMITS.nameMax - COPY_SUFFIX.length;
  return `${name.length > room ? name.slice(0, room).trimEnd() : name}${COPY_SUFFIX}`;
}

/**
 * An unsaved copy: same content, fresh ids. Nothing is stored until it goes
 * through the normal create path, so its supersets are still editable.
 */
export function buildRoutineCopy(
  source: RoutineInput,
  newId: () => string,
): RoutineInput {
  return {
    name: copyName(source.name),
    days: source.days.map((day) => ({
      id: newId(),
      name: day.name,
      exercises: day.exercises.map((exercise) => ({ ...exercise, id: newId() })),
    })),
  };
}
