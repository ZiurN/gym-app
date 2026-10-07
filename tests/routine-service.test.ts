import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", async () => (await import("./helpers/db")).dbModuleMock);

import {
  activateRoutine,
  createRoutine,
  deactivateRoutine,
  deleteRoutine,
  getActiveRoutine,
  getRoutine,
  listRoutines,
  saveRoutine,
} from "@/lib/routines/service";
import { createTestDb, insertUser, type Exec } from "./helpers/db";
import { day, exercise, routine } from "./helpers/routine";

let exec: Exec;
let userId: string;
let ids: Record<string, string>;

beforeEach(async () => {
  ({ exec } = await createTestDb());
  userId = await insertUser(exec);
  const rows = await exec(`SELECT id, slug FROM exercise`);
  ids = Object.fromEntries(rows.map((r) => [r.slug as string, r.id as string]));
});

const twoDays = () =>
  routine([
    day("Day 1", [exercise(ids["barbell-bench-press"]), exercise(ids["barbell-bent-over-row"])]),
    day("Day 2", [
      exercise(ids["barbell-curl"], { supersetGroup: 1 }),
      exercise(ids["cable-pushdown"], { supersetGroup: 1 }),
    ]),
  ]);

async function create(input = twoDays(), owner = userId) {
  const result = await createRoutine(owner, input);
  if (!result.ok) throw new Error(result.message);
  return result.id;
}

const openSession = (owner = userId) =>
  exec(
    `INSERT INTO workout_session (id, "userId", "dayName", status) VALUES ($1, $2, 'Day 1', 'in_progress') RETURNING id`,
    [randomUUID(), owner],
  );

describe("routine service", () => {
  it("creates an inactive routine with its days and exercises in order", async () => {
    const input = twoDays();
    const id = await create(input);
    const saved = await getRoutine(userId, id);
    expect(saved).toMatchObject({ id, name: "Upper/Lower", isActive: false });
    expect(saved?.days).toEqual(input.days);
  });

  it("rejects invalid input without writing", async () => {
    const result = await createRoutine(userId, { ...twoDays(), name: "  " });
    expect(result).toMatchObject({ ok: false, code: "invalid" });
    expect(await listRoutines(userId)).toEqual([]);
  });

  it("lists a user's routines with counts and empty days", async () => {
    await create();
    await create(routine([day("A", [exercise(ids["weighted-front-plank"])]), day("B")], "Home"));
    expect(
      (await listRoutines(userId)).map((r) => ({ ...r, id: undefined })),
    ).toEqual([
      { name: "Upper/Lower", isActive: false, dayCount: 2, exerciseCount: 4, emptyDayNames: [] },
      { name: "Home", isActive: false, dayCount: 2, exerciseCount: 1, emptyDayNames: ["B"] },
    ]);
  });

  it("treats another user's routine as not found for every operation", async () => {
    const id = await create();
    const other = await insertUser(exec);
    expect(await getRoutine(other, id)).toBeNull();
    expect(await listRoutines(other)).toEqual([]);
    for (const result of [
      await saveRoutine(other, id, twoDays()),
      await deleteRoutine(other, id),
      await activateRoutine(other, id),
      await deactivateRoutine(other, id),
    ]) {
      expect(result).toMatchObject({ ok: false, code: "not_found" });
    }
    expect(await getRoutine(userId, id)).not.toBeNull();
  });

  it("saves edits, keeping ids of what was kept", async () => {
    const input = twoDays();
    const id = await create(input);

    const edited = structuredClone(input);
    edited.name = "Renamed";
    edited.days.reverse(); // reorder days
    edited.days[1].name = "Push";
    edited.days[1].exercises.reverse(); // reorder exercises
    edited.days[1].exercises[0].targetSets = 5;
    const added = exercise(ids["weighted-front-plank"]);
    edited.days[1].exercises.push(added);
    edited.days.push(day("Day 3"));

    expect(await saveRoutine(userId, id, edited)).toEqual({ ok: true });
    const saved = await getRoutine(userId, id);
    expect(saved?.name).toBe("Renamed");
    expect(saved?.days).toEqual(edited.days);
  });

  it("removes days and exercises that are no longer submitted", async () => {
    const input = twoDays();
    const id = await create(input);
    const edited = structuredClone(input);
    edited.days = [edited.days[0]];
    edited.days[0].exercises = [edited.days[0].exercises[1]];

    expect(await saveRoutine(userId, id, edited)).toEqual({ ok: true });
    expect((await getRoutine(userId, id))?.days).toEqual(edited.days);
    const [{ n }] = await exec(`SELECT count(*)::int AS n FROM routine_exercise`);
    expect(n).toBe(1);
  });

  it("refuses to ungroup a saved superset and leaves the routine unchanged", async () => {
    const input = twoDays();
    const id = await create(input);
    const edited = structuredClone(input);
    edited.days[1].exercises.forEach((e) => (e.supersetGroup = null));

    const result = await saveRoutine(userId, id, edited);
    expect(result).toMatchObject({ ok: false, code: "invalid" });
    expect((await getRoutine(userId, id))?.days).toEqual(input.days);
  });

  it("deletes a routine with its days and exercises", async () => {
    const id = await create();
    expect(await deleteRoutine(userId, id)).toEqual({ ok: true });
    expect(await getRoutine(userId, id)).toBeNull();
    const [{ n }] = await exec(
      `SELECT (SELECT count(*) FROM routine_day)::int + (SELECT count(*) FROM routine_exercise)::int AS n`,
    );
    expect(n).toBe(0);
  });

  it("keeps exactly one routine active when another is activated", async () => {
    const a = await create();
    const b = await create(twoDays());
    expect(await activateRoutine(userId, a)).toEqual({ ok: true });
    expect(await activateRoutine(userId, b)).toEqual({ ok: true });

    const active = (await listRoutines(userId)).filter((r) => r.isActive);
    expect(active.map((r) => r.id)).toEqual([b]);
    expect((await getActiveRoutine(userId))?.id).toBe(b);
  });

  it("deactivates, leaving none active", async () => {
    const a = await create();
    await activateRoutine(userId, a);
    expect(await deactivateRoutine(userId, a)).toEqual({ ok: true });
    expect(await getActiveRoutine(userId)).toBeNull();
  });

  it("refuses to activate a routine with an empty day and names it", async () => {
    const id = await create(routine([day("A", [exercise(ids["weighted-front-plank"])]), day("Legs")]));
    const result = await activateRoutine(userId, id);
    expect(result).toMatchObject({ ok: false, code: "empty_days" });
    expect(result.ok ? "" : result.message).toContain("Legs");
    expect(await getActiveRoutine(userId)).toBeNull();
  });

  it("does not let one user's active routine affect another's", async () => {
    const other = await insertUser(exec);
    const mine = await create();
    const theirs = await create(twoDays(), other);
    await activateRoutine(userId, mine);
    await activateRoutine(other, theirs);
    expect((await getActiveRoutine(userId))?.id).toBe(mine);
    expect((await getActiveRoutine(other))?.id).toBe(theirs);
  });

  describe("while a workout is in progress", () => {
    it("rejects every change and leaves the data as it was", async () => {
      const input = twoDays();
      const a = await create(input);
      const b = await create(twoDays());
      await activateRoutine(userId, a);
      await openSession();

      const edited = structuredClone(input);
      edited.name = "Changed";
      for (const result of [
        await createRoutine(userId, twoDays()),
        await saveRoutine(userId, a, edited),
        await deleteRoutine(userId, b),
        await activateRoutine(userId, b),
        await deactivateRoutine(userId, a),
      ]) {
        expect(result).toMatchObject({ ok: false, code: "locked" });
      }

      const after = await listRoutines(userId);
      expect(after.map((r) => [r.id, r.name, r.isActive])).toEqual([
        [a, "Upper/Lower", true],
        [b, "Upper/Lower", false],
      ]);
    });

    it("is not locked by another user's workout, nor after the workout ends", async () => {
      const a = await create();
      await openSession(await insertUser(exec));
      expect(await activateRoutine(userId, a)).toEqual({ ok: true });

      const [{ id: sessionId }] = await openSession();
      expect(await deactivateRoutine(userId, a)).toMatchObject({ code: "locked" });
      await exec(`UPDATE workout_session SET status = 'completed' WHERE id = $1`, [sessionId]);
      expect(await deactivateRoutine(userId, a)).toEqual({ ok: true });
    });
  });

  it("keeps finished sessions when their routine is deleted", async () => {
    const input = twoDays();
    const id = await create(input);
    await exec(
      `INSERT INTO workout_session (id, "userId", "routineDayId", "dayName", status, "completedAt")
       VALUES ($1, $2, $3, 'Day 1', 'completed', now())`,
      [randomUUID(), userId, input.days[0].id],
    );
    await deleteRoutine(userId, id);
    const sessions = await exec(`SELECT "routineDayId", "dayName" FROM workout_session`);
    expect(sessions).toEqual([{ routineDayId: null, dayName: "Day 1" }]);
  });
});
