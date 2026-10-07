import type { CatalogExercise } from "./types";

export type CatalogFilter = {
  text?: string;
  muscle?: string | null;
  equipment?: string | null;
};

/** Lower case, with punctuation as spaces: "Pull-up" and "pull up" compare equal. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Exercises matching the search text and every selected filter.
 *
 * Every word typed must begin a word of the name, in any order, so "barbell
 * row" finds "Barbell bent over row" (and not "narrow"). With search text, a name that is exactly
 * what was typed comes first, then names containing the words as typed, then
 * the rest; within each group, and without search text, the given order is
 * kept.
 */
export function filterCatalog<T extends Pick<CatalogExercise, "name" | "primaryMuscle" | "equipment">>(
  exercises: T[],
  { text = "", muscle = null, equipment = null }: CatalogFilter,
): T[] {
  const phrase = normalize(text);
  const words = phrase === "" ? [] : phrase.split(" ");
  const matches = exercises
    .filter(
      (exercise) =>
        (muscle == null || exercise.primaryMuscle === muscle) &&
        (equipment == null || exercise.equipment === equipment),
    )
    .map((exercise) => ({ exercise, name: normalize(exercise.name) }))
    .filter(({ name }) => {
      const nameWords = name.split(" ");
      return words.every((word) => nameWords.some((w) => w.startsWith(word)));
    });
  if (words.length === 0) return matches.map(({ exercise }) => exercise);

  const rank = (name: string) =>
    name === phrase ? 0 : name.includes(phrase) ? 1 : 2;
  return matches
    .map((match, index) => ({ ...match, index }))
    .sort((a, b) => rank(a.name) - rank(b.name) || a.index - b.index)
    .map(({ exercise }) => exercise);
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
