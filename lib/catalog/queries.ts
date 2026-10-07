import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { exerciseInstructions, exercises } from "@/lib/db/schema";
import type { CatalogExercise, ExerciseDetails } from "./types";

type ExerciseRow = Pick<
  typeof exercises.$inferSelect,
  "id" | "slug" | "name" | "modality" | "primaryMuscle" | "equipment" | "retiredAt"
>;

function toCatalogExercise(row: ExerciseRow): CatalogExercise {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    modality: row.modality,
    primaryMuscle: row.primaryMuscle,
    equipment: row.equipment,
    retired: row.retiredAt != null,
  };
}

/**
 * The whole catalog, retired entries included, ordered by name. Only the
 * columns lists need: no instructions and no anatomical detail.
 */
export async function listCatalog(): Promise<CatalogExercise[]> {
  const rows = await db
    .select({
      id: exercises.id,
      slug: exercises.slug,
      name: exercises.name,
      modality: exercises.modality,
      primaryMuscle: exercises.primaryMuscle,
      equipment: exercises.equipment,
      retiredAt: exercises.retiredAt,
    })
    .from(exercises);
  // Sorted here so the order does not depend on the database's collation.
  return rows
    .map(toCatalogExercise)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export async function getExercisesByIds(
  ids: string[],
): Promise<Map<string, CatalogExercise>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select()
    .from(exercises)
    .where(inArray(exercises.id, [...new Set(ids)]));
  return new Map(rows.map((row) => [row.id, toCatalogExercise(row)]));
}

export async function getExerciseBySlug(
  slug: string,
): Promise<CatalogExercise | null> {
  const [row] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.slug, slug))
    .limit(1);
  return row ? toCatalogExercise(row) : null;
}

/** One exercise with its steps in the given language; retired ones included. */
export async function getExerciseDetails(
  slug: string,
  locale = "en",
): Promise<ExerciseDetails | null> {
  const [row] = await db
    .select({ exercise: exercises, steps: exerciseInstructions.steps })
    .from(exercises)
    .leftJoin(
      exerciseInstructions,
      and(
        eq(exerciseInstructions.exerciseId, exercises.id),
        eq(exerciseInstructions.locale, locale),
      ),
    )
    .where(eq(exercises.slug, slug))
    .limit(1);
  if (!row) return null;
  return {
    ...toCatalogExercise(row.exercise),
    targetMuscle: row.exercise.targetMuscle,
    secondaryMuscles: row.exercise.secondaryMuscles,
    equipmentDetail: row.exercise.equipmentDetail,
    hasPhotos: row.exercise.hasPhotos,
    steps: row.steps ?? [],
  };
}
