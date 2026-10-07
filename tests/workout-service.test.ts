import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", async () => (await import("./helpers/db")).dbModuleMock);

import { filterCatalog, pickerExercises } from "@/lib/catalog/filter";
import { getExerciseBySlug, listCatalog } from "@/lib/catalog/queries";
import {
  activateRoutine,
  createRoutine,
  deleteRoutine,
  saveRoutine,
} from "@/lib/routines/service";
import type { RoutineInput } from "@/lib/routines/types";
import {
  getDayPositions,
  getExerciseProgressPoints,
  getLastCompletedDayId,
  getLoggedExercises,
  getPrefills,
  getSessionSets,
} from "@/lib/workout/queries";
import {
  abandonSessionForUser,
  completeSessionForUser,
  completeSetForUser,
  startOrResumeSession,
} from "@/lib/workout/session-service";
import { createTestDb, insertUser, type Exec } from "./helpers/db";
import { day, exercise, routine } from "./helpers/routine";

let exec: Exec;
let userId: string;
let ids: Record<string, string>;
let input: RoutineInput;
let routineId: string;

async function newRoutine(owner: string, activate: boolean) {
  const value = routine([
    day("Upper", [
      exercise(ids["barbell-bench-press"], { targetSets: 2 }),
      exercise(ids["pull-up"], { targetSets: 2, alternativeExerciseId: ids["cable-pulldown"] }),
      exercise(ids["dumbbell-one-arm-bent-over-row"], { targetSets: 1 }),
    ]),
    day("Lower", [exercise(ids["weighted-front-plank"], { targetSets: 1 })]),
  ]);
  const created = await createRoutine(owner, value);
  if (!created.ok) throw new Error(created.message);
  if (activate) await activateRoutine(owner, created.id);
  return { value, id: created.id };
}

async function start(dayIndex = 0, owner = userId, source = input) {
  const result = await startOrResumeSession(owner, source.days[dayIndex].id, true);
  if (result.status !== "ready") throw new Error(result.status);
  return result.sessionId;
}

beforeEach(async () => {
  ({ exec } = await createTestDb());
  userId = await insertUser(exec);
  const rows = await exec(`SELECT id, slug FROM exercise`);
  ids = Object.fromEntries(rows.map((r) => [r.slug as string, r.id as string]));
  ({ value: input, id: routineId } = await newRoutine(userId, true));
});

const bench = (setIndex: number, load = 60, reps = 8) => ({
  exerciseId: ids["barbell-bench-press"],
  setIndex,
  load,
  reps,
  weightUnit: "kg" as const,
});

describe("catalog", () => {
  it("lists every exercise by name and hides retired ones from the picker", async () => {
    expect(Object.keys((await listCatalog())[0]).sort()).toEqual(
      ["equipment", "id", "modality", "name", "primaryMuscle", "retired", "slug"],
    );
    await exec(`UPDATE exercise SET "retiredAt" = now() WHERE slug = 'weighted-front-plank'`);
    const all = await listCatalog();
    expect(all.map((e) => e.name)).toEqual([...all.map((e) => e.name)].sort((a, b) => a.localeCompare(b, "en")));
    expect(all.find((e) => e.slug === "weighted-front-plank")?.retired).toBe(true);
    expect(pickerExercises(all).some((e) => e.slug === "weighted-front-plank")).toBe(false);
    expect((await getExerciseBySlug("weighted-front-plank"))?.name).toBe("Weighted front plank");
    expect(await getExerciseBySlug("nope")).toBeNull();
  });

  it("filters by name ignoring case, and by muscle and equipment together", async () => {
    const all = await listCatalog();
    const names = (filter: Parameters<typeof filterCatalog>[1]) =>
      filterCatalog(all, filter).map((e) => e.name);

    const bench = names({ text: "BENCH PRESS" });
    expect(bench).toContain("Barbell bench press");
    expect(bench.every((name) => name.toLowerCase().includes("bench press"))).toBe(true);

    const narrowed = filterCatalog(all, { text: "press", muscle: "chest", equipment: "dumbbell" });
    expect(narrowed.map((e) => e.name)).toContain("Dumbbell bench press");
    expect(
      narrowed.every(
        (e) =>
          e.primaryMuscle === "chest" &&
          e.equipment === "dumbbell" &&
          e.name.toLowerCase().includes("press"),
      ),
    ).toBe(true);
    expect(narrowed.length).toBeLessThan(bench.length + 100);
    expect(names({ text: "no such exercise" })).toEqual([]);
    expect(names({})).toHaveLength(all.length);
  });
});

describe("starting a session", () => {
  it("starts from a day of the active routine with the day's name", async () => {
    const result = await startOrResumeSession(userId, input.days[0].id);
    expect(result).toMatchObject({ status: "ready", dayName: "Upper" });
  });

  it("resumes the open session of the same day", async () => {
    const first = await start();
    expect(await start()).toBe(first);
  });

  it("refuses a day of an inactive routine and a day of another user", async () => {
    const inactive = await newRoutine(userId, false);
    const other = await insertUser(exec);
    const foreign = await newRoutine(other, true);
    for (const dayId of [inactive.value.days[0].id, foreign.value.days[0].id, randomUUID()]) {
      expect(await startOrResumeSession(userId, dayId, true)).toEqual({
        status: "not_available",
      });
    }
    const [{ n }] = await exec(`SELECT count(*)::int AS n FROM workout_session`);
    expect(n).toBe(0);
  });

  it("reports a conflict with another open day unless told to replace it", async () => {
    const first = await start(0);
    await completeSetForUser(userId, first, bench(1));
    expect(await startOrResumeSession(userId, input.days[1].id)).toMatchObject({
      status: "conflict", sessionId: first,
    });
    const second = await start(1);
    expect(second).not.toBe(first);
    const [{ n }] = await exec(`SELECT count(*)::int AS n FROM workout_set`);
    expect(n).toBe(0); // the discarded session left nothing behind
  });
});

describe("logging sets", () => {
  it("stores load, unit and reps, and remembers the unit for the exercise", async () => {
    const sessionId = await start();
    const { set } = await completeSetForUser(userId, sessionId, { ...bench(1), weightUnit: "lb" });
    expect(set).toMatchObject({
      userId, exerciseId: ids["barbell-bench-press"], setIndex: 1,
      load: 60, reps: 8, weightUnit: "lb", modality: "load_reps", side: null,
    });
    expect((await getPrefills(userId, [ids["barbell-bench-press"]]))[ids["barbell-bench-press"]])
      .toEqual({ weightUnit: "lb" });
  });

  it("does not create a second row when the same set is finished twice", async () => {
    const sessionId = await start();
    const first = await completeSetForUser(userId, sessionId, bench(1));
    const again = await completeSetForUser(userId, sessionId, bench(1, 999, 1));
    expect(again.set.id).toBe(first.set.id);
    expect(again.set.load).toBe(60);
    expect(await getSessionSets(sessionId)).toHaveLength(1);
  });

  it("stores each side of a per-side set separately", async () => {
    const sessionId = await start();
    const pallof = { exerciseId: ids["dumbbell-one-arm-bent-over-row"], setIndex: 1, load: 12.5, reps: 12, weightUnit: "kg" as const };
    await completeSetForUser(userId, sessionId, { ...pallof, side: "left" });
    await completeSetForUser(userId, sessionId, { ...pallof, side: "right" });
    expect((await getSessionSets(sessionId)).map((s) => s.side).sort()).toEqual(["left", "right"]);
    await expect(completeSetForUser(userId, sessionId, pallof)).rejects.toThrow();
  });

  it("stores a timed set in seconds", async () => {
    const sessionId = await start(1);
    const { set } = await completeSetForUser(userId, sessionId, {
      exerciseId: ids["weighted-front-plank"], setIndex: 1, durationSec: 45,
    });
    expect(set).toMatchObject({ durationSec: 45, modality: "time", load: null });
  });

  it("rejects an exercise that is not in the day and a set beyond the target", async () => {
    const sessionId = await start();
    await expect(
      completeSetForUser(userId, sessionId, { ...bench(1), exerciseId: ids["weighted-front-plank"] }),
    ).rejects.toThrow();
    await expect(completeSetForUser(userId, sessionId, bench(3))).rejects.toThrow();
  });

  it("rejects sets for a session that belongs to someone else", async () => {
    const sessionId = await start();
    const other = await insertUser(exec);
    await expect(completeSetForUser(other, sessionId, bench(1))).rejects.toThrow();
  });

  it("records the alternative under its own exercise and then refuses the main one", async () => {
    const sessionId = await start();
    const pulldown = { exerciseId: ids["cable-pulldown"], setIndex: 1, load: 50, reps: 10, weightUnit: "kg" as const };
    const { set } = await completeSetForUser(userId, sessionId, pulldown);
    expect(set.exerciseId).toBe(ids["cable-pulldown"]);

    await expect(
      completeSetForUser(userId, sessionId, { ...pulldown, exerciseId: ids["pull-up"], setIndex: 2 }),
    ).rejects.toThrow();
    await completeSetForUser(userId, sessionId, { ...pulldown, setIndex: 2 });
    expect((await getSessionSets(sessionId)).map((s) => s.exerciseId)).toEqual([
      ids["cable-pulldown"], ids["cable-pulldown"],
    ]);
  });
});

describe("day entries for the session", () => {
  it("come in routine order with targets and the alternative", async () => {
    const positions = await getDayPositions(input.days[0].id);
    expect(positions.map((p) => [p.exercise.slug, p.alternative?.slug ?? null, p.targetSets])).toEqual([
      ["barbell-bench-press", null, 2],
      ["pull-up", "cable-pulldown", 2],
      ["dumbbell-one-arm-bent-over-row", null, 1],
    ]);
    expect(positions[2].exercise.modality).toBe("per_side");
  });
});

describe("history, pre-fill and progress", () => {
  async function completedSession(dayIndex: number, sets: Parameters<typeof completeSetForUser>[2][], daysAgo: number) {
    const sessionId = await start(dayIndex);
    for (const set of sets) await completeSetForUser(userId, sessionId, set);
    await completeSessionForUser(userId, sessionId);
    const at = new Date(Date.now() - daysAgo * 86_400_000);
    await exec(`UPDATE workout_session SET "completedAt" = $1 WHERE id = $2`, [at, sessionId]);
    await exec(`UPDATE workout_set SET "completedAt" = $1 WHERE "sessionId" = $2`, [at, sessionId]);
    return sessionId;
  }
  const benchRef = () => ({ id: ids["barbell-bench-press"], modality: "load_reps" as const });

  it("counts only completed sessions", async () => {
    await completedSession(0, [bench(1, 60, 8), bench(2, 62.5, 6)], 7);
    const open = await start();
    await completeSetForUser(userId, open, bench(1, 100, 1));

    const points = await getExerciseProgressPoints(userId, benchRef());
    expect(points.map((p) => [p.value, p.reps, p.unit])).toEqual([[62.5, 6, "kg"]]);
    expect((await getPrefills(userId, [ids["barbell-bench-press"]]))[ids["barbell-bench-press"]])
      .toMatchObject({ load: 62.5, reps: 6 });

    await abandonSessionForUser(userId, open);
    expect(await getExerciseProgressPoints(userId, benchRef())).toHaveLength(1);
    const [{ n }] = await exec(`SELECT count(*)::int AS n FROM workout_set`);
    expect(n).toBe(2);
  });

  it("orders progress by session date and pre-fills from the most recent one", async () => {
    await completedSession(0, [bench(1, 65, 7)], 1);
    await completedSession(0, [bench(1, 60, 8)], 14);
    expect((await getExerciseProgressPoints(userId, benchRef())).map((p) => p.value)).toEqual([60, 65]);
    expect((await getPrefills(userId, [ids["barbell-bench-press"], ids["weighted-front-plank"]]))).toEqual({
      [ids["barbell-bench-press"]]: { load: 65, reps: 7, durationSec: undefined, weightUnit: "kg" },
      [ids["weighted-front-plank"]]: { load: undefined, reps: undefined, durationSec: undefined, weightUnit: "kg" },
    });
  });

  it("never returns another user's data", async () => {
    await completedSession(0, [bench(1)], 1);
    const other = await insertUser(exec);
    expect(await getExerciseProgressPoints(other, benchRef())).toEqual([]);
    expect(await getLoggedExercises(other)).toEqual([]);
    expect((await getPrefills(other, [ids["barbell-bench-press"]]))[ids["barbell-bench-press"]])
      .toEqual({ weightUnit: "kg" });
  });

  it("finds the last completed day of the active routine", async () => {
    const dayIds = input.days.map((d) => d.id);
    expect(await getLastCompletedDayId(userId, dayIds)).toBeNull();
    await completedSession(1, [], 3);
    await completedSession(0, [bench(1)], 1);
    expect(await getLastCompletedDayId(userId, dayIds)).toBe(dayIds[0]);
  });

  it("keeps history and progress when the routine is edited, renamed or deleted", async () => {
    await completedSession(0, [bench(1, 60, 8)], 2);

    const edited = structuredClone(input);
    edited.days[0].name = "Push";
    edited.days[0].exercises = edited.days[0].exercises.filter(
      (e) => e.exerciseId !== ids["barbell-bench-press"],
    );
    expect(await saveRoutine(userId, routineId, edited)).toEqual({ ok: true });

    const logged = await getLoggedExercises(userId);
    expect(logged.map((l) => [l.exercise.slug, l.latest?.value])).toEqual([
      ["barbell-bench-press", 60],
    ]);
    const [session] = await exec(`SELECT "dayName" FROM workout_session`);
    expect(session.dayName).toBe("Upper"); // the name the day had when it was trained

    expect(await deleteRoutine(userId, routineId)).toEqual({ ok: true });
    expect(await getExerciseProgressPoints(userId, benchRef())).toHaveLength(1);
    expect(await getLoggedExercises(userId)).toHaveLength(1);
  });

  it("lists each logged exercise once with its latest session", async () => {
    await completedSession(0, [bench(1, 60, 8)], 9);
    await completedSession(0, [bench(1, 70, 5), { exerciseId: ids["cable-pulldown"], setIndex: 1, load: 50, reps: 10, weightUnit: "kg" }], 2);
    const logged = await getLoggedExercises(userId);
    expect(logged.map((l) => [l.exercise.slug, l.latest?.value])).toEqual([
      ["barbell-bench-press", 70],
      ["cable-pulldown", 50],
    ]);
  });
});
