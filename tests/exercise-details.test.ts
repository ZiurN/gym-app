import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", async () => (await import("./helpers/db")).dbModuleMock);

import catalog from "@/data/exercise-catalog.json";
import instructions from "@/data/exercise-instructions.en.json";
import photoMap from "@/data/exercise-photo-map.json";
import { limitResults, PICKER_LIMIT } from "@/lib/catalog/filter";
import {
  MUSCLE_REGIONS,
  muscleRegionsOf,
  regionsOfMuscle,
} from "@/lib/catalog/muscle-map";
import { getExerciseDetails, listCatalog } from "@/lib/catalog/queries";
import { proposeMatches } from "@/scripts/lib/photo-match.mjs";
import { seedCatalog } from "@/scripts/lib/seed-catalog.mjs";
import { createTestDb, type Exec } from "./helpers/db";

const steps: Record<string, string[]> = instructions;
const photos: Record<string, string> = photoMap;
const bySource = new Map(catalog.map((e) => [e.sourceId, e]));

describe("exercise details query", () => {
  let exec: Exec;
  const bench = catalog.find((e) => e.slug === "barbell-bench-press")!;

  beforeAll(async () => {
    ({ exec } = await createTestDb());
    await seedCatalog(exec, [bench], randomUUID, {
      instructions: { [bench.slug]: steps[bench.slug] },
      photoSourceIds: [bench.sourceId],
    });
  });

  it("returns steps, secondary muscles, specific equipment and the photo flag", async () => {
    expect(await getExerciseDetails("barbell-bench-press")).toMatchObject({
      slug: "barbell-bench-press",
      name: "Barbell bench press",
      primaryMuscle: "chest",
      targetMuscle: "pectorals",
      secondaryMuscles: bench.secondaryMuscles,
      equipmentDetail: "barbell",
      hasPhotos: true,
      retired: false,
      steps: steps["barbell-bench-press"],
    });
  });

  it("still returns a retired exercise, and one without stored steps", async () => {
    await exec(`UPDATE exercise SET "retiredAt" = now() WHERE slug = 'barbell-bench-press'`);
    expect((await getExerciseDetails("barbell-bench-press"))?.retired).toBe(true);
    expect(await getExerciseDetails("barbell-curl")).toMatchObject({ steps: [], hasPhotos: false });
  });

  it("returns nothing for an unknown exercise", async () => {
    expect(await getExerciseDetails("no-such-exercise")).toBeNull();
  });

  it("keeps instructions out of the catalog list", async () => {
    const [first] = await listCatalog();
    expect(first).not.toHaveProperty("steps");
    expect(first).not.toHaveProperty("secondaryMuscles");
  });
});

describe("picker limit", () => {
  it("lists the first 50 and reports the total", () => {
    const many = Array.from({ length: 120 }, (_, i) => i);
    expect(PICKER_LIMIT).toBe(50);
    expect(limitResults(many)).toEqual({ shown: many.slice(0, 50), total: 120 });
  });

  it("lists everything when there are 50 or fewer", () => {
    const few = Array.from({ length: 50 }, (_, i) => i);
    expect(limitResults(few)).toEqual({ shown: few, total: 50 });
    expect(limitResults([])).toEqual({ shown: [], total: 0 });
  });
});

describe("muscle map", () => {
  it("highlights the target and, more lightly, the secondary muscles", () => {
    expect(
      muscleRegionsOf({ targetMuscle: "pectorals", secondaryMuscles: ["triceps", "shoulders"] }),
    ).toEqual({ target: ["chest"], secondary: ["triceps", "shoulders", "rear-shoulders"], unplaced: [] });
  });

  it("does not repeat a target region as secondary", () => {
    expect(
      muscleRegionsOf({ targetMuscle: "abs", secondaryMuscles: ["core", "hip flexors"] }),
    ).toEqual({ target: ["abs"], secondary: ["obliques", "hip-flexors"], unplaced: [] });
  });

  it("names a muscle it has no region for instead of dropping it", () => {
    expect(
      muscleRegionsOf({ targetMuscle: "calves", secondaryMuscles: ["ankles", "made up muscle", "hamstrings"] }),
    ).toEqual({ target: ["calves"], secondary: ["hamstrings"], unplaced: ["ankles", "made up muscle"] });
  });

  it("shows only the secondary muscles of a cardio exercise", () => {
    expect(
      muscleRegionsOf({ targetMuscle: "cardiovascular system", secondaryMuscles: ["quadriceps", "calves"] }),
    ).toEqual({ target: [], secondary: ["quads", "calves"], unplaced: [] });
  });

  it("knows every muscle name in the catalog; only extremities have no region", () => {
    const names = new Set(catalog.flatMap((e) => [e.targetMuscle, ...e.secondaryMuscles]));
    const unknown = [...names].filter((name) => regionsOfMuscle(name) === undefined);
    expect(unknown).toEqual([]);

    const withoutRegion = [...names].filter((name) => regionsOfMuscle(name)?.length === 0).sort();
    expect(withoutRegion).toEqual([
      "ankle stabilizers", "ankles", "cardiovascular system", "feet", "hands", "shins",
    ]);
    for (const name of names) {
      for (const region of regionsOfMuscle(name) ?? []) expect(MUSCLE_REGIONS).toContain(region);
    }
  });
});

describe("photo matching", () => {
  const entry = (name: string, images = ["a/0.jpg", "a/1.jpg"]) => ({ id: name.replace(/\W+/g, "_"), name, images });
  const ours = (sourceId: string, name: string) => ({ sourceId, name });

  it("proposes an exact name match", () => {
    expect(proposeMatches([ours("1", "Barbell curl")], [entry("Barbell Curl")])).toEqual({
      "1": { id: "Barbell_Curl", how: "exact" },
    });
  });

  it("proposes the same words in another order, marked as such", () => {
    expect(proposeMatches([ours("1", "Barbell front squat")], [entry("Front Barbell Squat")])).toEqual({
      "1": { id: "Front_Barbell_Squat", how: "words" },
    });
  });

  it("proposes nothing for a different exercise or an entry without two photos", () => {
    expect(proposeMatches([ours("1", "Barbell bench press")], [entry("Barbell Bench Press - Medium Grip")])).toEqual({});
    expect(proposeMatches([ours("1", "Plank")], [entry("Plank", ["a/0.jpg"])])).toEqual({});
  });

  it("gives a photo entry to one exercise only, preferring the exact name", () => {
    const proposals = proposeMatches(
      [ours("1", "Squat barbell front"), ours("2", "Front barbell squat")],
      [entry("Front Barbell Squat")],
    );
    expect(proposals).toEqual({ "2": { id: "Front_Barbell_Squat", how: "exact" } });
  });
});

describe("photo mapping and files", () => {
  const root = new URL("../public/exercise-photos/", import.meta.url);

  it("maps existing exercises and uses each photo set once", () => {
    for (const sourceId of Object.keys(photos)) expect(bySource.has(sourceId), sourceId).toBe(true);
    expect(new Set(Object.values(photos)).size).toBe(Object.keys(photos).length);
  });

  it("has a start and an end photo under 60 KB for every mapped exercise, and no others", () => {
    const expected = Object.keys(photos).map((sourceId) => bySource.get(sourceId)!.slug).sort();
    expect(readdirSync(root).sort()).toEqual(expected);
    for (const slug of expected) {
      for (const position of ["start", "end"]) {
        const file = new URL(`${slug}/${position}.webp`, root);
        expect(existsSync(file), `${slug}/${position}`).toBe(true);
        expect(statSync(file).size).toBeLessThan(60_000);
      }
    }
  });
});
