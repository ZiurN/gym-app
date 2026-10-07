import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Modality } from "@/lib/catalog/types";
import { buildRoutineCopy, copyName } from "@/lib/routines/copy";
import { reconcileRoutine } from "@/lib/routines/reconcile";
import {
  emptyDayNames,
  parseRoutineInput,
  validateRoutine,
} from "@/lib/routines/validation";
import { day, exercise, routine } from "./helpers/routine";

const [BENCH, ROW, CURL, PUSHDOWN, RAISE, PLANK] = Array.from({ length: 6 }, () => randomUUID());
const catalog = new Map<string, { modality: Modality }>([
  [BENCH, { modality: "load_reps" }],
  [ROW, { modality: "load_reps" }],
  [CURL, { modality: "load_reps" }],
  [PUSHDOWN, { modality: "load_reps" }],
  [RAISE, { modality: "load_reps" }],
  [PLANK, { modality: "time" }],
]);
const codes = (input: Parameters<typeof validateRoutine>[0]) =>
  validateRoutine(input, catalog).map((issue) => issue.code);

describe("validateRoutine", () => {
  it("accepts a routine with a superset, an alternative and optional fields empty", () => {
    const input = routine([
      day("Day 1", [
        exercise(BENCH, { targetSets: 4, restSeconds: 120, repMin: 6, repMax: 10, alternativeExerciseId: ROW }),
        exercise(CURL, { supersetGroup: 1, restSeconds: 60 }),
        exercise(PUSHDOWN, { supersetGroup: 1, restSeconds: 60, targetSets: 2 }),
      ]),
      day("Day 2"),
    ]);
    expect(codes(input)).toEqual([]);
  });

  it("requires a name", () => {
    expect(codes(routine([day("Day 1")], ""))).toContain("name_required");
  });

  it.each([0, 8])("rejects %i days", (count) => {
    const days = Array.from({ length: count }, (_, i) => day(`Day ${i + 1}`));
    expect(codes(routine(days))).toContain("day_count");
  });

  it("accepts 1 and 7 days", () => {
    for (const count of [1, 7]) {
      const days = Array.from({ length: count }, (_, i) => day(`Day ${i + 1}`));
      expect(codes(routine(days))).toEqual([]);
    }
  });

  it("rejects the same exercise twice in a day but allows it in two days", () => {
    expect(codes(routine([day("A", [exercise(BENCH), exercise(BENCH)])]))).toContain(
      "duplicate_exercise",
    );
    expect(codes(routine([day("A", [exercise(BENCH)]), day("B", [exercise(BENCH)])]))).toEqual([]);
  });

  it.each([
    ["sets below range", { targetSets: 0 }, "sets_range"],
    ["sets above range", { targetSets: 11 }, "sets_range"],
    ["fractional sets", { targetSets: 2.5 }, "sets_range"],
    ["rest below range", { restSeconds: -1 }, "rest_range"],
    ["rest above range", { restSeconds: 601 }, "rest_range"],
    ["rep range upside down", { repMin: 10, repMax: 6 }, "reps_order"],
    ["reps of zero", { repMin: 0 }, "reps_range"],
    ["note too long", { note: "x".repeat(281) }, "note_too_long"],
  ])("rejects %s", (_label, overrides, code) => {
    expect(codes(routine([day("A", [exercise(BENCH, overrides)])]))).toContain(code);
  });

  it("rejects an exercise that is not in the catalog", () => {
    expect(codes(routine([day("A", [exercise(randomUUID())])]))).toContain("unknown_exercise");
  });

  it("rejects more than 30 exercises in a day", () => {
    const many = Array.from({ length: 31 }, () => exercise(BENCH));
    expect(codes(routine([day("A", many)]))).toContain("too_many_exercises");
  });

  describe("supersets", () => {
    it("rejects a superset of one and of five", () => {
      expect(codes(routine([day("A", [exercise(BENCH, { supersetGroup: 1 })])]))).toContain(
        "superset_size",
      );
      const five = [BENCH, ROW, CURL, PUSHDOWN, RAISE].map((id) =>
        exercise(id, { supersetGroup: 1 }),
      );
      expect(codes(routine([day("A", five)]))).toContain("superset_size");
    });

    it("rejects members that are not adjacent", () => {
      const input = routine([
        day("A", [
          exercise(BENCH, { supersetGroup: 1 }),
          exercise(ROW),
          exercise(CURL, { supersetGroup: 1 }),
        ]),
      ]);
      expect(codes(input)).toContain("superset_not_adjacent");
    });

    it("rejects different rest times inside a superset", () => {
      const input = routine([
        day("A", [
          exercise(BENCH, { supersetGroup: 1, restSeconds: 60 }),
          exercise(ROW, { supersetGroup: 1, restSeconds: 90 }),
        ]),
      ]);
      expect(codes(input)).toContain("superset_rest");
    });
  });

  describe("alternatives", () => {
    it("rejects a different modality", () => {
      const input = routine([day("A", [exercise(BENCH, { alternativeExerciseId: PLANK })])]);
      expect(codes(input)).toContain("alternative_modality");
    });

    it("rejects an alternative already in the day, as an entry or another alternative", () => {
      const asEntry = routine([
        day("A", [exercise(BENCH, { alternativeExerciseId: ROW }), exercise(ROW)]),
      ]);
      const asAlternative = routine([
        day("A", [
          exercise(BENCH, { alternativeExerciseId: ROW }),
          exercise(CURL, { alternativeExerciseId: ROW }),
        ]),
      ]);
      expect(codes(asEntry)).toContain("duplicate_exercise");
      expect(codes(asAlternative)).toContain("duplicate_exercise");
    });

    it("rejects the exercise as its own alternative", () => {
      const input = routine([day("A", [exercise(BENCH, { alternativeExerciseId: BENCH })])]);
      expect(codes(input)).toContain("alternative_same");
    });
  });
});

describe("parseRoutineInput", () => {
  it("trims names and turns an empty note into none", () => {
    const parsed = parseRoutineInput({
      name: "  Push  ",
      days: [{ id: randomUUID(), name: " Day 1 ", exercises: [{ ...exercise(BENCH), note: "   " }] }],
    });
    expect(parsed?.name).toBe("Push");
    expect(parsed?.days[0].name).toBe("Day 1");
    expect(parsed?.days[0].exercises[0].note).toBeNull();
  });

  it.each([null, "x", {}, { name: 1, days: [] }, { name: "a", days: [{}] },
    { name: "a", days: [{ id: "1", name: "d", exercises: [{ id: "1" }] }] },
  ])("rejects malformed input %#", (raw) => {
    expect(parseRoutineInput(raw)).toBeNull();
  });
});

describe("emptyDayNames", () => {
  it("names the days without exercises", () => {
    expect(emptyDayNames(routine([day("A", [exercise(BENCH)]), day("B"), day("C")]))).toEqual([
      "B", "C",
    ]);
  });
});

describe("reconcileRoutine", () => {
  const stored = () =>
    routine([
      day("Day 1", [exercise(BENCH), exercise(ROW)]),
      day("Day 2", [exercise(CURL, { supersetGroup: 1 }), exercise(PUSHDOWN, { supersetGroup: 1 })]),
    ]);
  const clone = <T,>(value: T): T => structuredClone(value);

  it("plans no deletes or inserts when nothing changed, keeping every id", () => {
    const before = stored();
    const plan = reconcileRoutine(before, clone(before));
    expect(plan.issues).toEqual([]);
    expect(plan.days.insert).toEqual([]);
    expect(plan.days.deleteIds).toEqual([]);
    expect(plan.exercises.insert).toEqual([]);
    expect(plan.exercises.deleteIds).toEqual([]);
    expect(plan.days.update.map((d) => d.id)).toEqual(before.days.map((d) => d.id));
  });

  it("adds, renames, reorders and removes days", () => {
    const before = stored();
    const after = clone(before);
    after.days[0].name = "Push";
    const added = day("Day 3", [exercise(RAISE)]);
    after.days = [added, after.days[0]]; // Day 2 removed, new day first

    const plan = reconcileRoutine(before, after);
    expect(plan.issues).toEqual([]);
    expect(plan.days.insert).toEqual([{ id: added.id, name: "Day 3", position: 0 }]);
    expect(plan.days.update).toEqual([{ id: before.days[0].id, name: "Push", position: 1 }]);
    expect(plan.days.deleteIds).toEqual([before.days[1].id]);
    expect(plan.exercises.deleteIds.sort()).toEqual(
      before.days[1].exercises.map((e) => e.id).sort(),
    );
    expect(plan.exercises.insert.map((e) => e.routineDayId)).toEqual([added.id]);
  });

  it("adds, reorders and removes exercises, preserving kept ids", () => {
    const before = stored();
    const after = clone(before);
    const [bench, row] = after.days[0].exercises;
    const added = exercise(RAISE);
    after.days[0].exercises = [added, bench]; // row removed, bench moved down
    bench.targetSets = 5;

    const plan = reconcileRoutine(before, after);
    expect(plan.issues).toEqual([]);
    expect(plan.exercises.deleteIds).toEqual([row.id]);
    expect(plan.exercises.insert.map((e) => [e.id, e.position])).toEqual([[added.id, 0]]);
    const kept = plan.exercises.update.find((e) => e.id === bench.id);
    expect(kept).toMatchObject({ position: 1, targetSets: 5, exerciseId: BENCH });
  });

  it("refuses to swap the exercise of a kept row", () => {
    const before = stored();
    const after = clone(before);
    after.days[0].exercises[0].exerciseId = RAISE;
    expect(reconcileRoutine(before, after).issues.map((i) => i.code)).toEqual([
      "exercise_replaced",
    ]);
  });

  describe("saved supersets", () => {
    const supersetCodes = (mutate: (after: ReturnType<typeof stored>) => void) => {
      const before = stored();
      const after = clone(before);
      mutate(after);
      return reconcileRoutine(before, after).issues.map((i) => i.code);
    };

    it("accepts target changes, moving the block and a new rest time", () => {
      expect(
        supersetCodes((after) => {
          const [curl, pushdown] = after.days[1].exercises;
          curl.targetSets = 4;
          curl.restSeconds = pushdown.restSeconds = 45;
          after.days[1].exercises = [exercise(RAISE), curl, pushdown];
        }),
      ).toEqual([]);
    });

    it("accepts removing the whole superset", () => {
      expect(supersetCodes((after) => (after.days[1].exercises = []))).toEqual([]);
      expect(supersetCodes((after) => after.days.pop())).toEqual([]);
    });

    it("rejects ungrouping", () => {
      expect(
        supersetCodes((after) =>
          after.days[1].exercises.forEach((e) => (e.supersetGroup = null)),
        ),
      ).toEqual(["saved_superset_changed"]);
    });

    it("rejects removing one member", () => {
      expect(supersetCodes((after) => after.days[1].exercises.pop())).toEqual([
        "saved_superset_changed",
      ]);
    });

    it("rejects adding a member", () => {
      expect(
        supersetCodes((after) =>
          after.days[1].exercises.push(exercise(RAISE, { supersetGroup: 1 })),
        ),
      ).toEqual(["saved_superset_changed"]);
    });

    it("rejects reordering inside the superset", () => {
      expect(supersetCodes((after) => after.days[1].exercises.reverse())).toEqual([
        "saved_superset_changed",
      ]);
    });

    it("lets ungrouped stored exercises form a new superset", () => {
      expect(
        supersetCodes((after) =>
          after.days[0].exercises.forEach((e) => (e.supersetGroup = 7)),
        ),
      ).toEqual([]);
    });
  });
});

describe("buildRoutineCopy", () => {
  it("matches the source in everything but ids and name, sharing no id", () => {
    const source = routine([
      day("Day 1", [
        exercise(BENCH, { alternativeExerciseId: ROW, note: "mine", repMin: 6, repMax: 10 }),
        exercise(CURL, { supersetGroup: 1 }),
        exercise(PUSHDOWN, { supersetGroup: 1 }),
      ]),
      day("Day 2"),
    ]);
    const copy = buildRoutineCopy(source, randomUUID);

    const ids = (r: typeof source) =>
      r.days.flatMap((d) => [d.id, ...d.exercises.map((e) => e.id)]);
    expect(ids(copy).filter((id) => ids(source).includes(id))).toEqual([]);
    expect(new Set(ids(copy)).size).toBe(ids(source).length);

    const strip = (r: typeof source) =>
      r.days.map((d) => ({ name: d.name, exercises: d.exercises.map((e) => ({ ...e, id: undefined })) }));
    expect(strip(copy)).toEqual(strip(source));
    expect(copy.name).toBe("Upper/Lower (copy)");
    expect(validateRoutine(copy, catalog)).toEqual([]);
  });

  it("shortens a long name so the suffix still fits in 80 characters", () => {
    const name = copyName("x".repeat(80));
    expect(name).toHaveLength(80);
    expect(name.endsWith(" (copy)")).toBe(true);
  });
});
