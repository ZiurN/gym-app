import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import catalog from "@/data/exercise-catalog.json";
import { seedCatalog } from "@/scripts/lib/seed-catalog.mjs";
import { createPg, execOf, insertUser, type Exec } from "./helpers/db";

describe("database rules", () => {
  async function migrated() {
    const pg = await createPg();
    const exec = execOf(pg);
    await seedCatalog(exec, catalog, randomUUID);
    const userId = await insertUser(exec);
    const [exercise] = await exec(`SELECT id FROM exercise WHERE slug = 'weighted-front-plank'`);
    return { exec, userId, exerciseId: exercise.id as string };
  }
  const session = (exec: Exec, userId: string, status: string) =>
    exec(
      `INSERT INTO workout_session (id, "userId", "dayName", status) VALUES ($1, $2, 'Day 1', $3) RETURNING id`,
      [randomUUID(), userId, status],
    );

  it("rejects a second active routine for the same user", async () => {
    const { exec, userId } = await migrated();
    const insert = (active: boolean) =>
      exec(`INSERT INTO routine (id, "userId", name, "isActive") VALUES ($1, $2, 'R', $3)`, [
        randomUUID(), userId, active,
      ]);
    await insert(true);
    await insert(false);
    await expect(insert(true)).rejects.toThrow(/routine_one_active_idx/);
  });

  it("rejects a second in-progress session but allows many completed ones", async () => {
    const { exec, userId } = await migrated();
    await session(exec, userId, "completed");
    await session(exec, userId, "completed");
    await session(exec, userId, "in_progress");
    await expect(session(exec, userId, "in_progress")).rejects.toThrow(
      /workout_session_one_in_progress_idx/,
    );
  });

  it("rejects a duplicate set, treating a missing side as equal", async () => {
    const { exec, userId, exerciseId } = await migrated();
    const [{ id: sessionId }] = await session(exec, userId, "in_progress");
    const set = (setIndex: number, side: string | null) =>
      exec(
        `INSERT INTO workout_set (id, "sessionId", "userId", "exerciseId", "setIndex", modality, side)
         VALUES ($1, $2, $3, $4, $5, 'time', $6)`,
        [randomUUID(), sessionId, userId, exerciseId, setIndex, side],
      );
    await set(1, null);
    await set(2, null);
    await set(3, "left");
    await set(3, "right");
    await expect(set(1, null)).rejects.toThrow(/workout_set_slot_uq/);
    await expect(set(3, "left")).rejects.toThrow(/workout_set_slot_uq/);
  });

  it("refuses to delete an exercise that a set references", async () => {
    const { exec, userId, exerciseId } = await migrated();
    const [{ id: sessionId }] = await session(exec, userId, "completed");
    await exec(
      `INSERT INTO workout_set (id, "sessionId", "userId", "exerciseId", "setIndex", modality)
       VALUES ($1, $2, $3, $4, 1, 'time')`,
      [randomUUID(), sessionId, userId, exerciseId],
    );
    await expect(exec(`DELETE FROM exercise WHERE id = $1`, [exerciseId])).rejects.toThrow();
  });
});
