import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Modality } from "@/lib/catalog/types";
import {
  addDay,
  addExercise,
  blocksOf,
  canGroupWithNext,
  describeTargets,
  groupWithNext,
  moveBlock,
  moveDay,
  newRoutineDraft,
  removeDay,
  removeExercise,
  removeGroup,
  savedSupersetsOf,
  setGroupRest,
  ungroup,
} from "@/lib/routines/draft";
import { reconcileRoutine } from "@/lib/routines/reconcile";
import { validateRoutine } from "@/lib/routines/validation";
import { day, exercise, routine } from "./helpers/routine";

const E: string[] = Array.from({ length: 6 }, () => randomUUID());
const catalog = new Map<string, { modality: Modality }>(E.map((id) => [id, { modality: "load_reps" }]));
const names = (d: ReturnType<typeof day>) =>
  d.exercises.map((e) => `${E.indexOf(e.exerciseId)}${e.supersetGroup ?? ""}`);
const fiveSingles = () => day("A", E.slice(0, 5).map((id) => exercise(id)));

describe("days", () => {
  it("creates a routine with the chosen number of days named in order", () => {
    const draft = newRoutineDraft(4, randomUUID);
    expect(draft.days.map((d) => d.name)).toEqual(["Day 1", "Day 2", "Day 3", "Day 4"]);
    expect(validateRoutine({ ...draft, name: "x" }, catalog)).toEqual([]);
  });

  it("adds up to 7 days and never removes the last one", () => {
    let draft = newRoutineDraft(6, randomUUID);
    draft = addDay(draft, randomUUID);
    expect(addDay(draft, randomUUID).days).toHaveLength(7);

    let one = newRoutineDraft(1, randomUUID);
    one = removeDay(one, one.days[0].id);
    expect(one.days).toHaveLength(1);
  });

  it("removes a day keeping the others in order, and reorders days", () => {
    const draft = newRoutineDraft(3, randomUUID);
    const [a, b, c] = draft.days.map((d) => d.id);
    expect(removeDay(draft, b).days.map((d) => d.id)).toEqual([a, c]);
    expect(moveDay(draft, c, -1).days.map((d) => d.id)).toEqual([a, c, b]);
    expect(moveDay(draft, a, -1)).toBe(draft);
  });
});

describe("exercises", () => {
  it("appends with 3 sets and 90 s rest, and refuses a duplicate", () => {
    const d = addExercise(day("A"), E[0], randomUUID);
    expect(d.exercises[0]).toMatchObject({ targetSets: 3, restSeconds: 90, repMin: null, note: null });
    expect(addExercise(d, E[0], randomUUID)).toBe(d);
  });

  it("refuses an exercise that is already there as an alternative", () => {
    const d = day("A", [exercise(E[0], { alternativeExerciseId: E[1] })]);
    expect(addExercise(d, E[1], randomUUID)).toBe(d);
  });
});

describe("supersets", () => {
  it("groups two neighbours with one rest time, then grows up to four", () => {
    let d = fiveSingles();
    d.exercises[1].restSeconds = 45;
    d = groupWithNext(d, d.exercises[1].id);
    expect(names(d)).toEqual(["0", "11", "21", "3", "4"]);
    expect(d.exercises[2].restSeconds).toBe(45);

    d = groupWithNext(d, d.exercises[1].id);
    d = groupWithNext(d, d.exercises[1].id);
    expect(names(d)).toEqual(["0", "11", "21", "31", "41"]);
    expect(canGroupWithNext(d, d.exercises[1].id)).toBe(false);
    expect(validateRoutine(routine([d]), catalog)).toEqual([]);
  });

  it("cannot group the last exercise or swallow another superset", () => {
    let d = fiveSingles();
    expect(canGroupWithNext(d, d.exercises[4].id)).toBe(false);
    d = groupWithNext(d, d.exercises[2].id); // 2+3
    expect(canGroupWithNext(d, d.exercises[1].id)).toBe(false);
  });

  it("gives a second superset its own number", () => {
    let d = fiveSingles();
    d = groupWithNext(d, d.exercises[0].id);
    d = groupWithNext(d, d.exercises[2].id);
    expect(names(d)).toEqual(["01", "11", "22", "32", "4"]);
    expect(blocksOf(d).map((b) => b.exercises.length)).toEqual([2, 2, 1]);
  });

  it("moves a superset as one block and a single exercise over it", () => {
    let d = fiveSingles();
    d = groupWithNext(d, d.exercises[1].id); // 0 [1 2] 3 4
    d = moveBlock(d, d.exercises[2].id, 1);
    expect(names(d)).toEqual(["0", "3", "11", "21", "4"]);
    d = moveBlock(d, d.exercises[0].id, 1);
    d = moveBlock(d, d.exercises[1].id, 1);
    expect(names(d)).toEqual(["3", "11", "21", "0", "4"]);
    expect(validateRoutine(routine([d]), catalog)).toEqual([]);
  });

  it("ungroups in place, removes whole, and sets one rest for the group", () => {
    let d = fiveSingles();
    d = groupWithNext(d, d.exercises[1].id);
    expect(setGroupRest(d, 1, 30).exercises.map((e) => e.restSeconds)).toEqual([90, 30, 30, 90, 90]);
    expect(names(ungroup(d, 1))).toEqual(["0", "1", "2", "3", "4"]);
    expect(names(removeGroup(d, 1))).toEqual(["0", "3", "4"]);
  });

  it("dissolves a superset that is left with one exercise", () => {
    let d = fiveSingles();
    d = groupWithNext(d, d.exercises[1].id);
    d = removeExercise(d, d.exercises[1].id);
    expect(names(d)).toEqual(["0", "2", "3", "4"]);
  });

  it("produces edits of a saved superset that the server accepts or refuses as specified", () => {
    let stored = fiveSingles();
    stored = groupWithNext(stored, stored.exercises[1].id);
    const before = routine([stored]);
    expect(savedSupersetsOf(before)).toEqual({ [stored.id]: [1] });
    const issues = (after: typeof stored) =>
      reconcileRoutine(before, routine([{ ...after, id: stored.id }])).issues.map((i) => i.code);

    expect(issues(moveBlock(stored, stored.exercises[1].id, 1))).toEqual([]);
    expect(issues(setGroupRest(stored, 1, 30))).toEqual([]);
    expect(issues(removeGroup(stored, 1))).toEqual([]);
    expect(issues(ungroup(stored, 1))).toEqual(["saved_superset_changed"]);
    expect(issues(groupWithNext(stored, stored.exercises[1].id))).toEqual(["saved_superset_changed"]);
    expect(issues(removeExercise(stored, stored.exercises[1].id))).toEqual(["saved_superset_changed"]);
  });
});

describe("describeTargets", () => {
  it("summarises sets, reps and rest", () => {
    expect(describeTargets(exercise(E[0], { targetSets: 4, repMin: 6, repMax: 10, restSeconds: 150 }), false))
      .toBe("4 sets · 6–10 reps · rest 150 s");
    expect(describeTargets(exercise(E[0], { targetSets: 1 }), false)).toBe("1 set · rest 90 s");
    expect(describeTargets(exercise(E[0], { repMin: 12, repMax: 12 }), true)).toBe("3 sets · 12 reps");
  });
});
