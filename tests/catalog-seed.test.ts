import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import catalog from "@/data/exercise-catalog.json";
import instructions from "@/data/exercise-instructions.en.json";
import overrides from "@/data/exercise-modality-overrides.json";
import supplement from "@/data/exercise-supplement.json";
import { EQUIPMENT, MODALITIES, MUSCLE_GROUPS } from "@/lib/catalog/types";
import {
  buildCatalog,
  deriveModality,
  displayName,
} from "@/scripts/lib/import-exercises.mjs";
import { seedCatalog, setRetired } from "@/scripts/lib/seed-catalog.mjs";
import { createPg, execOf, insertUser } from "./helpers/db";

const steps: Record<string, string[]> = instructions;

describe("catalog seed files", () => {
  it("hold the 1,324 imported exercises and our own additions, with unique slugs and source ids", () => {
    expect(catalog).toHaveLength(1324 + supplement.length);
    for (const extra of supplement) {
      expect(catalog.some((e) => e.sourceId === extra.id), extra.id).toBe(true);
    }
    expect(new Set(catalog.map((e) => e.slug)).size).toBe(catalog.length);
    expect(new Set(catalog.map((e) => e.sourceId)).size).toBe(catalog.length);
  });

  it("give every exercise known groups, a target, its equipment and steps", () => {
    for (const e of catalog) {
      expect(e.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(e.name.trim().length).toBeGreaterThan(0);
      expect(MODALITIES).toContain(e.modality);
      expect(MUSCLE_GROUPS).toContain(e.primaryMuscle);
      expect(EQUIPMENT).toContain(e.equipment);
      expect(e.targetMuscle.length).toBeGreaterThan(0);
      expect(e.equipmentDetail.length).toBeGreaterThan(0);
      expect(steps[e.slug]?.length ?? 0, e.slug).toBeGreaterThan(0);
    }
    expect(Object.keys(steps)).toHaveLength(catalog.length);
  });

  it("have no stray non-English letters in names", () => {
    expect(catalog.filter((e) => /[^\x20-\x7e°]/.test(e.name)).map((e) => e.name)).toEqual([]);
  });

  it("match the reviewed number of exercises per logging modality", () => {
    const count = (modality: string) => catalog.filter((e) => e.modality === modality).length;
    const own = (modality: string) => supplement.filter((e) => e.modality === modality).length;
    // Change these only after reading the affected exercises; see docs/CATALOG.md.
    expect({ load_reps: count("load_reps"), time: count("time"), per_side: count("per_side") })
      .toEqual({ load_reps: 1067 + own("load_reps"), time: 98 + own("time"), per_side: 159 + own("per_side") });
    const sourceIds = new Set(catalog.map((e) => e.sourceId));
    for (const id of Object.keys(overrides)) expect(sourceIds, id).toContain(id);
  });

  it("carry nothing of the source dataset's media", () => {
    const text = JSON.stringify(catalog) + JSON.stringify(instructions);
    for (const marker of [".gif", ".jpg", ".png", "images/", "videos/", "gif_url", "media_id", "Gym visual", "gymvisual"]) {
      expect(text.includes(marker), marker).toBe(false);
    }
  });
});

describe("import", () => {
  const record = (overridesOf: Record<string, unknown> = {}) => ({
    id: "0001",
    name: "barbell bench press",
    body_part: "chest",
    equipment: "barbell",
    target: "pectorals",
    secondary_muscles: ["triceps", "shoulders"],
    instruction_steps: { en: ["Lie on the bench.", "Press the bar."] },
    image: "images/0001-x.jpg",
    gif_url: "videos/0001-x.gif",
    media_id: "x",
    attribution: "© someone",
    ...overridesOf,
  });

  it("maps a record to a catalog entry and drops every media field", () => {
    const { catalog: out, instructions: outSteps } = buildCatalog([record()]);
    expect(out).toEqual([
      {
        sourceId: "0001",
        slug: "barbell-bench-press",
        name: "Barbell bench press",
        modality: "load_reps",
        primaryMuscle: "chest",
        equipment: "barbell",
        targetMuscle: "pectorals",
        secondaryMuscles: ["triceps", "shoulders"],
        equipmentDetail: "barbell",
      },
    ]);
    expect(outSteps).toEqual({ "barbell-bench-press": ["Lie on the bench.", "Press the bar."] });
    expect(JSON.stringify(out) + JSON.stringify(outSteps)).not.toMatch(/gif|jpg|©/);
  });

  it("aborts on a target or equipment value it has no mapping for", () => {
    expect(() => buildCatalog([record({ target: "eyebrows" })])).toThrow(/eyebrows/);
    expect(() => buildCatalog([record({ equipment: "trampoline" })])).toThrow(/trampoline/);
  });

  it("aborts when an exercise has no English steps", () => {
    expect(() => buildCatalog([record({ instruction_steps: { es: ["x"] } })])).toThrow(/steps/);
  });

  it("suffixes the later of two equal names with its source id", () => {
    const { catalog: out } = buildCatalog([record({ id: "0900" }), record({ id: "0002" })]);
    expect(out.map((e) => [e.sourceId, e.slug])).toEqual([
      ["0002", "barbell-bench-press"],
      ["0900", "barbell-bench-press-0900"],
    ]);
  });

  it("keeps an exercise's slug when its name changes upstream", () => {
    const previous = [{ sourceId: "0001", slug: "barbell-bench-press" }];
    const { catalog: out, instructions: outSteps } = buildCatalog(
      [record({ name: "barbell flat bench press" })],
      { previous },
    );
    expect(out[0]).toMatchObject({ slug: "barbell-bench-press", name: "Barbell flat bench press" });
    expect(Object.keys(outSteps)).toEqual(["barbell-bench-press"]);
  });

  it("adds our own exercises after the dataset's and checks them", () => {
    const extra = {
      id: "custom-hip-thrust",
      name: "barbell hip thrust",
      modality: "load_reps",
      primaryMuscle: "glutes",
      equipment: "barbell",
      targetMuscle: "glutes",
      secondaryMuscles: ["hamstrings"],
      equipmentDetail: "barbell",
      steps: ["Sit against a bench.", "Raise your hips."],
    };
    const { catalog: out, instructions: outSteps } = buildCatalog([record()], { supplement: [extra] });
    expect(out.map((e) => e.slug)).toEqual(["barbell-bench-press", "barbell-hip-thrust"]);
    expect(out[1]).toMatchObject({ sourceId: "custom-hip-thrust", name: "Barbell hip thrust" });
    expect(outSteps["barbell-hip-thrust"]).toEqual(extra.steps);

    expect(() => buildCatalog([], { supplement: [{ ...extra, equipment: "trampoline" }] })).toThrow(/equipment/);
    expect(() => buildCatalog([], { supplement: [{ ...extra, steps: [] }] })).toThrow(/steps/);
    expect(() => buildCatalog([record({ id: "custom-hip-thrust" })], { supplement: [extra] })).toThrow(/unique id/);
  });

  it("writes names in sentence case", () => {
    expect(displayName("ez barbell  spider curl")).toBe("EZ barbell spider curl");
    expect(displayName("3/4 sit-up")).toBe("3/4 sit-up");
    expect(displayName("sled 45\u0432° leg press")).toBe("Sled 45° leg press");
  });

  describe("logging modality", () => {
    const modality = (name: string, body_part = "back", id = "x") =>
      deriveModality({ id, name, body_part });

    it("is weight and repetitions by default", () => {
      expect(modality("barbell bent over row")).toBe("load_reps");
      expect(modality("hanging leg raise")).toBe("load_reps");
      expect(modality("crunch floor")).toBe("load_reps");
    });

    it("is timed for cardio and for holds, stretches and carries", () => {
      expect(modality("burpee", "cardio")).toBe("time");
      for (const name of ["weighted front plank", "dead hang", "hamstring stretch", "farmers walk", "l-sit on floor"]) {
        expect(modality(name), name).toBe("time");
      }
    });

    it("is per side for one-arm and one-leg movements", () => {
      for (const name of ["dumbbell one arm bent-over row", "single leg calf raise", "one-arm chin-up"]) {
        expect(modality(name), name).toBe("per_side");
      }
    });

    it("lets a reviewed override win over the rules", () => {
      expect(deriveModality({ id: "7", name: "kettlebell hang clean", body_part: "back" })).toBe("time");
      expect(
        deriveModality({ id: "7", name: "kettlebell hang clean", body_part: "back" }, { "7": "load_reps" }),
      ).toBe("load_reps");
    });
  });
});

describe("catalog seed script", () => {
  const few = catalog.slice(0, 5);
  const fewSteps = Object.fromEntries(few.map((e) => [e.slug, steps[e.slug]]));
  const stored = (exec: ReturnType<typeof execOf>) =>
    exec(
      `SELECT e.slug, e.name, e."sourceId", e."targetMuscle", e."secondaryMuscles", e."equipmentDetail",
              e."hasPhotos", i.steps
       FROM exercise e LEFT JOIN exercise_instruction i ON i."exerciseId" = e.id AND i.locale = 'en'
       ORDER BY e.slug`,
    );

  it("writes detail, instructions and the photo flag, and changes nothing on a second run", async () => {
    const exec = execOf(await createPg());
    const options = { instructions: fewSteps, photoSourceIds: [few[1].sourceId], prune: true };
    const first = await seedCatalog(exec, few, randomUUID, options);
    expect(first).toMatchObject({ total: 5, instructions: 5, deleted: [], retired: [] });

    const before = await stored(exec);
    const row = before.find((r) => r.slug === few[1].slug)!;
    expect(row).toMatchObject({
      sourceId: few[1].sourceId,
      targetMuscle: few[1].targetMuscle,
      secondaryMuscles: few[1].secondaryMuscles,
      equipmentDetail: few[1].equipmentDetail,
      hasPhotos: true,
      steps: steps[few[1].slug],
    });
    expect(before.filter((r) => r.hasPhotos)).toHaveLength(1);
    const ids = await exec(`SELECT id FROM exercise ORDER BY slug`);

    await seedCatalog(exec, few, randomUUID, options);
    expect(await stored(exec)).toEqual(before);
    expect(await exec(`SELECT id FROM exercise ORDER BY slug`)).toEqual(ids);

    // Seeding with an empty photo mapping clears every flag.
    await seedCatalog(exec, few, randomUUID, { instructions: fewSteps });
    expect((await stored(exec)).filter((r) => r.hasPhotos)).toEqual([]);
  });

  it("corrects a changed name by slug", async () => {
    const exec = execOf(await createPg());
    await seedCatalog(exec, few, randomUUID);
    await seedCatalog(exec, [{ ...few[0], name: "Renamed" }, ...few.slice(1)], randomUUID);
    const [row] = await exec(`SELECT name FROM exercise WHERE slug = $1`, [few[0].slug]);
    expect(row.name).toBe("Renamed");
  });

  it("deletes exercises missing from the seed when unreferenced and retires the referenced ones", async () => {
    const exec = execOf(await createPg());
    const old = (slug: string) => ({
      slug, name: slug, modality: "load_reps", primaryMuscle: "chest", equipment: "barbell",
    });
    await seedCatalog(exec, [old("old-unused"), old("old-in-routine"), old("old-alternative"), old("old-logged"), old("old-preferred")], randomUUID);
    const id = async (slug: string) =>
      (await exec(`SELECT id FROM exercise WHERE slug = $1`, [slug]))[0].id as string;
    const userId = await insertUser(exec);
    const [routineId, dayId, sessionId] = [randomUUID(), randomUUID(), randomUUID()];
    await exec(`INSERT INTO routine (id, "userId", name) VALUES ($1, $2, 'R')`, [routineId, userId]);
    await exec(`INSERT INTO routine_day (id, "routineId", name, position) VALUES ($1, $2, 'D', 0)`, [dayId, routineId]);
    await exec(
      `INSERT INTO routine_exercise (id, "routineDayId", "exerciseId", "alternativeExerciseId", position, "targetSets", "restSeconds")
       VALUES ($1, $2, $3, $4, 0, 3, 90)`,
      [randomUUID(), dayId, await id("old-in-routine"), await id("old-alternative")],
    );
    await exec(`INSERT INTO workout_session (id, "userId", "dayName", status) VALUES ($1, $2, 'D', 'completed')`, [sessionId, userId]);
    await exec(
      `INSERT INTO workout_set (id, "sessionId", "userId", "exerciseId", "setIndex", modality) VALUES ($1, $2, $3, $4, 1, 'load_reps')`,
      [randomUUID(), sessionId, userId, await id("old-logged")],
    );
    await exec(`INSERT INTO exercise_preference ("userId", "exerciseId") VALUES ($1, $2)`, [userId, await id("old-preferred")]);

    const result = await seedCatalog(exec, few, randomUUID, { instructions: fewSteps, prune: true });
    expect(result.deleted).toEqual(["old-unused"]);
    expect(result.retired.sort()).toEqual(["old-alternative", "old-in-routine", "old-logged", "old-preferred"]);
    expect(result.total).toBe(9);

    const [{ sets }] = await exec(`SELECT count(*)::int AS sets FROM workout_set`);
    expect(sets).toBe(1);
    const retired = await exec(`SELECT slug FROM exercise WHERE "retiredAt" IS NOT NULL ORDER BY slug`);
    expect(retired.map((r) => r.slug)).toEqual(["old-alternative", "old-in-routine", "old-logged", "old-preferred"]);
  });

  it("does not remove anything unless asked to prune", async () => {
    const exec = execOf(await createPg());
    await seedCatalog(exec, few, randomUUID);
    const result = await seedCatalog(exec, few.slice(0, 2), randomUUID);
    expect(result).toMatchObject({ total: 5, deleted: [], retired: [] });
  });

  it("retires and restores an exercise without deleting it", async () => {
    const exec = execOf(await createPg());
    await seedCatalog(exec, few, randomUUID);
    expect(await setRetired(exec, few[0].slug, true)).toBe(true);
    const [row] = await exec(`SELECT "retiredAt" FROM exercise WHERE slug = $1`, [few[0].slug]);
    expect(row.retiredAt).not.toBeNull();
    expect(await setRetired(exec, few[0].slug, false)).toBe(true);
    expect(await setRetired(exec, "no-such-exercise", true)).toBe(false);
  });
});
