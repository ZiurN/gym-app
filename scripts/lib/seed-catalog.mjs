/**
 * Catalog seeding shared by the CLI and the tests.
 * `exec(text, params)` runs one statement and resolves to its rows.
 */

const INSTRUCTION_CHUNK = 300;

/**
 * Makes the database's catalog match the seed file. Upserts by slug, so it is
 * safe to repeat and it corrects names and attributes.
 *
 * @param options.instructions  steps keyed by slug, stored under `locale`
 * @param options.photoSourceIds  source ids of the exercises that have photos
 * @param options.prune  remove exercises that are not in the seed: deleted when
 *   nothing references them, retired when a routine, set or preference does
 */
export async function seedCatalog(
  exec,
  exercises,
  newId,
  { instructions = {}, locale = "en", photoSourceIds = [], prune = false } = {},
) {
  const withPhotos = new Set(photoSourceIds);
  const rows = exercises.map((e) => ({
    id: newId(),
    slug: e.slug,
    name: e.name,
    modality: e.modality,
    primaryMuscle: e.primaryMuscle,
    equipment: e.equipment,
    sourceId: e.sourceId ?? null,
    targetMuscle: e.targetMuscle ?? null,
    secondaryMuscles: e.secondaryMuscles ?? [],
    equipmentDetail: e.equipmentDetail ?? null,
    hasPhotos: e.sourceId != null && withPhotos.has(e.sourceId),
  }));
  await exec(
    `INSERT INTO exercise (
       id, slug, name, modality, "primaryMuscle", equipment,
       "sourceId", "targetMuscle", "secondaryMuscles", "equipmentDetail", "hasPhotos"
     )
     SELECT x.id, x.slug, x.name, x.modality, x."primaryMuscle", x.equipment,
            x."sourceId", x."targetMuscle",
            ARRAY(SELECT jsonb_array_elements_text(x."secondaryMuscles")),
            x."equipmentDetail", x."hasPhotos"
     FROM jsonb_to_recordset($1::jsonb) AS x(
       id text, slug text, name text, modality text, "primaryMuscle" text, equipment text,
       "sourceId" text, "targetMuscle" text, "secondaryMuscles" jsonb,
       "equipmentDetail" text, "hasPhotos" boolean
     )
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       modality = EXCLUDED.modality,
       "primaryMuscle" = EXCLUDED."primaryMuscle",
       equipment = EXCLUDED.equipment,
       "sourceId" = EXCLUDED."sourceId",
       "targetMuscle" = EXCLUDED."targetMuscle",
       "secondaryMuscles" = EXCLUDED."secondaryMuscles",
       "equipmentDetail" = EXCLUDED."equipmentDetail",
       "hasPhotos" = EXCLUDED."hasPhotos"`,
    [JSON.stringify(rows)],
  );

  const steps = exercises
    .filter((e) => instructions[e.slug]?.length)
    .map((e) => ({ slug: e.slug, steps: instructions[e.slug] }));
  for (let i = 0; i < steps.length; i += INSTRUCTION_CHUNK) {
    await exec(
      `INSERT INTO exercise_instruction ("exerciseId", locale, steps)
       SELECT e.id, $2, ARRAY(SELECT jsonb_array_elements_text(x.steps))
       FROM jsonb_to_recordset($1::jsonb) AS x(slug text, steps jsonb)
       JOIN exercise e ON e.slug = x.slug
       ON CONFLICT ("exerciseId", locale) DO UPDATE SET steps = EXCLUDED.steps`,
      [JSON.stringify(steps.slice(i, i + INSTRUCTION_CHUNK)), locale],
    );
  }

  let deleted = [];
  let retired = [];
  if (prune) {
    const slugs = exercises.map((e) => e.slug);
    deleted = await exec(
      `DELETE FROM exercise e
       WHERE e.slug <> ALL($1::text[])
         AND NOT EXISTS (SELECT 1 FROM routine_exercise r
                         WHERE r."exerciseId" = e.id OR r."alternativeExerciseId" = e.id)
         AND NOT EXISTS (SELECT 1 FROM workout_set s WHERE s."exerciseId" = e.id)
         AND NOT EXISTS (SELECT 1 FROM exercise_preference p WHERE p."exerciseId" = e.id)
       RETURNING slug`,
      [slugs],
    );
    retired = await exec(
      `UPDATE exercise SET "retiredAt" = now()
       WHERE slug <> ALL($1::text[]) AND "retiredAt" IS NULL
       RETURNING slug`,
      [slugs],
    );
  }

  const [{ count }] = await exec(`SELECT count(*)::int AS count FROM exercise`, []);
  return {
    total: count,
    instructions: steps.length,
    deleted: deleted.map((row) => row.slug),
    retired: retired.map((row) => row.slug),
  };
}

/** Hides an exercise from the picker; data that references it is untouched. */
export async function setRetired(exec, slug, retired) {
  const rows = await exec(
    `UPDATE exercise SET "retiredAt" = ${retired ? "now()" : "NULL"} WHERE slug = $1 RETURNING slug`,
    [slug],
  );
  return rows.length === 1;
}
