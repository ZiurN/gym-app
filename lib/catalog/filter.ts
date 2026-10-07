import type { CatalogExercise } from "./types";

export type CatalogFilter = {
  text?: string;
  muscle?: string | null;
  equipment?: string | null;
};

/** Exercises matching the search text and every selected filter. */
export function filterCatalog<T extends Pick<CatalogExercise, "name" | "primaryMuscle" | "equipment">>(
  exercises: T[],
  { text = "", muscle = null, equipment = null }: CatalogFilter,
): T[] {
  const needle = text.trim().toLowerCase();
  return exercises.filter(
    (exercise) =>
      (needle === "" || exercise.name.toLowerCase().includes(needle)) &&
      (muscle == null || exercise.primaryMuscle === muscle) &&
      (equipment == null || exercise.equipment === equipment),
  );
}

/** What the picker offers: retired exercises are hidden. */
export function pickerExercises<T extends Pick<CatalogExercise, "retired">>(
  exercises: T[],
): T[] {
  return exercises.filter((exercise) => !exercise.retired);
}

export const PICKER_LIMIT = 50;

/** The first matches to list, plus how many matched in total. */
export function limitResults<T>(
  results: T[],
  limit = PICKER_LIMIT,
): { shown: T[]; total: number } {
  return { shown: results.slice(0, limit), total: results.length };
}
