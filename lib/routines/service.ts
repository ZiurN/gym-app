import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { getExercisesByIds } from "@/lib/catalog/queries";
import { db, runBatch } from "@/lib/db";
import { PG_DIVISION_BY_ZERO, pgErrorCode } from "@/lib/db/errors";
import {
  routineDays,
  routineExercises,
  routines,
  workoutSessions,
} from "@/lib/db/schema";
import { reconcileRoutine } from "./reconcile";
import type {
  Routine,
  RoutineInput,
  RoutineIssue,
  RoutineResult,
  RoutineSummary,
} from "./types";
import {
  emptyDayNames,
  parseRoutineInput,
  ROUTINE_LIMITS,
  validateRoutine,
} from "./validation";

const LOCKED = {
  ok: false,
  code: "locked",
  message: "Routines can't be changed while a workout is in progress.",
} as const;

const NOT_FOUND = {
  ok: false,
  code: "not_found",
  message: "Routine not found.",
} as const;

const invalid = (issues: RoutineIssue[]) =>
  ({
    ok: false,
    code: "invalid",
    message: issues[0]?.message ?? "Invalid routine data.",
    issues,
  }) as const;

/**
 * First statement of every routine batch: fails with division by zero, which
 * aborts the whole batch, when the user has a workout in progress. A separate
 * check-then-write could race with a session starting in between.
 */
function lockGuard(userId: string) {
  return db.execute(sql`
    select 1 / (case when exists (
      select 1 from ${workoutSessions}
      where ${workoutSessions.userId} = ${userId}
        and ${workoutSessions.status} = 'in_progress'
    ) then 0 else 1 end) as unlocked
  `);
}

async function runGuarded(
  userId: string,
  queries: BatchItem<"pg">[],
): Promise<"done" | "locked"> {
  try {
    await runBatch([lockGuard(userId), ...queries]);
    return "done";
  } catch (error) {
    if (pgErrorCode(error) === PG_DIVISION_BY_ZERO) return "locked";
    throw error;
  }
}

async function loadDays(routineIds: string[]) {
  if (routineIds.length === 0) return [];
  const days = await db
    .select()
    .from(routineDays)
    .where(inArray(routineDays.routineId, routineIds))
    .orderBy(asc(routineDays.position));
  const rows =
    days.length === 0
      ? []
      : await db
          .select()
          .from(routineExercises)
          .where(
            inArray(
              routineExercises.routineDayId,
              days.map((day) => day.id),
            ),
          )
          .orderBy(asc(routineExercises.position));
  return days.map((day) => ({
    routineId: day.routineId,
    id: day.id,
    name: day.name,
    exercises: rows
      .filter((row) => row.routineDayId === day.id)
      .map((row) => ({
        id: row.id,
        exerciseId: row.exerciseId,
        targetSets: row.targetSets,
        restSeconds: row.restSeconds,
        repMin: row.repMin,
        repMax: row.repMax,
        note: row.note,
        supersetGroup: row.supersetGroup,
        alternativeExerciseId: row.alternativeExerciseId,
      })),
  }));
}

function toRoutine(
  row: typeof routines.$inferSelect,
  days: Awaited<ReturnType<typeof loadDays>>,
): Routine {
  return {
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    days: days
      .filter((day) => day.routineId === row.id)
      .map(({ id, name, exercises }) => ({ id, name, exercises })),
  };
}

/** The routine if it belongs to the user; another user's routine is "not found". */
export async function getRoutine(
  userId: string,
  routineId: string,
): Promise<Routine | null> {
  const [row] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
    .limit(1);
  return row ? toRoutine(row, await loadDays([row.id])) : null;
}

export async function getActiveRoutine(userId: string): Promise<Routine | null> {
  const [row] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.isActive, true)))
    .limit(1);
  return row ? toRoutine(row, await loadDays([row.id])) : null;
}

export async function listRoutines(userId: string): Promise<RoutineSummary[]> {
  const rows = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(asc(routines.createdAt));
  const days = await loadDays(rows.map((row) => row.id));
  return rows.map((row) => {
    const routine = toRoutine(row, days);
    return {
      id: routine.id,
      name: routine.name,
      isActive: routine.isActive,
      dayCount: routine.days.length,
      exerciseCount: routine.days.reduce((n, day) => n + day.exercises.length, 0),
      emptyDayNames: emptyDayNames(routine),
    };
  });
}

async function checkInput(
  raw: unknown,
): Promise<{ input: RoutineInput } | { issues: RoutineIssue[] }> {
  const input = parseRoutineInput(raw);
  if (!input) {
    return { issues: [{ code: "bad_shape", message: "Invalid routine data." }] };
  }
  const catalog = await getExercisesByIds(
    input.days.flatMap((day) =>
      day.exercises.flatMap((exercise) =>
        exercise.alternativeExerciseId
          ? [exercise.exerciseId, exercise.alternativeExerciseId]
          : [exercise.exerciseId],
      ),
    ),
  );
  const issues = validateRoutine(input, catalog);
  return issues.length > 0 ? { issues } : { input };
}

export async function createRoutine(
  userId: string,
  raw: unknown,
): Promise<RoutineResult<{ id: string }>> {
  const checked = await checkInput(raw);
  if ("issues" in checked) return invalid(checked.issues);
  const { input } = checked;

  const existing = await db
    .select({ id: routines.id })
    .from(routines)
    .where(eq(routines.userId, userId));
  if (existing.length >= ROUTINE_LIMITS.routinesPerUser) {
    return {
      ok: false,
      code: "limit",
      message: `You can keep up to ${ROUTINE_LIMITS.routinesPerUser} routines.`,
    };
  }

  // A fresh routine has no stored rows, so the plan is all inserts.
  const plan = reconcileRoutine({ name: "", days: [] }, input);
  const id = crypto.randomUUID();
  const outcome = await runGuarded(userId, [
    db.insert(routines).values({ id, userId, name: input.name }),
    db
      .insert(routineDays)
      .values(plan.days.insert.map((day) => ({ ...day, routineId: id }))),
    ...(plan.exercises.insert.length > 0
      ? [db.insert(routineExercises).values(plan.exercises.insert)]
      : []),
  ]);
  return outcome === "locked" ? LOCKED : { ok: true, id };
}

export async function saveRoutine(
  userId: string,
  routineId: string,
  raw: unknown,
): Promise<RoutineResult> {
  const stored = await getRoutine(userId, routineId);
  if (!stored) return NOT_FOUND;

  const checked = await checkInput(raw);
  if ("issues" in checked) return invalid(checked.issues);
  const { input } = checked;

  const plan = reconcileRoutine(stored, input);
  if (plan.issues.length > 0) return invalid(plan.issues);

  const storedDayIds = stored.days.map((day) => day.id);
  const queries: BatchItem<"pg">[] = [
    db
      .update(routines)
      .set({ name: input.name, updatedAt: new Date() })
      .where(and(eq(routines.id, routineId), eq(routines.userId, userId))),
  ];
  if (plan.exercises.deleteIds.length > 0) {
    queries.push(
      db
        .delete(routineExercises)
        .where(inArray(routineExercises.id, plan.exercises.deleteIds)),
    );
  }
  if (plan.days.deleteIds.length > 0) {
    queries.push(
      db.delete(routineDays).where(inArray(routineDays.id, plan.days.deleteIds)),
    );
  }
  // Positions are unique per parent, so kept rows are first moved out of the
  // way; otherwise swapping two of them would collide mid-batch.
  queries.push(
    db
      .update(routineDays)
      .set({ position: sql`${routineDays.position} + 1000` })
      .where(eq(routineDays.routineId, routineId)),
    db
      .update(routineExercises)
      .set({ position: sql`${routineExercises.position} + 1000` })
      .where(inArray(routineExercises.routineDayId, storedDayIds)),
  );
  for (const day of plan.days.update) {
    queries.push(
      db
        .update(routineDays)
        .set({ name: day.name, position: day.position })
        .where(and(eq(routineDays.id, day.id), eq(routineDays.routineId, routineId))),
    );
  }
  if (plan.days.insert.length > 0) {
    queries.push(
      db
        .insert(routineDays)
        .values(plan.days.insert.map((day) => ({ ...day, routineId }))),
    );
  }
  for (const { id, routineDayId, ...values } of plan.exercises.update) {
    queries.push(
      db
        .update(routineExercises)
        .set(values)
        .where(
          and(
            eq(routineExercises.id, id),
            eq(routineExercises.routineDayId, routineDayId),
          ),
        ),
    );
  }
  if (plan.exercises.insert.length > 0) {
    queries.push(db.insert(routineExercises).values(plan.exercises.insert));
  }

  return (await runGuarded(userId, queries)) === "locked" ? LOCKED : { ok: true };
}

export async function deleteRoutine(
  userId: string,
  routineId: string,
): Promise<RoutineResult> {
  if (!(await getRoutine(userId, routineId))) return NOT_FOUND;
  const outcome = await runGuarded(userId, [
    db
      .delete(routines)
      .where(and(eq(routines.id, routineId), eq(routines.userId, userId))),
  ]);
  return outcome === "locked" ? LOCKED : { ok: true };
}

export async function activateRoutine(
  userId: string,
  routineId: string,
): Promise<RoutineResult> {
  const routine = await getRoutine(userId, routineId);
  if (!routine) return NOT_FOUND;

  const empty = emptyDayNames(routine);
  if (empty.length > 0) {
    return {
      ok: false,
      code: "empty_days",
      message: `Add at least one exercise to: ${empty.join(", ")}.`,
    };
  }

  const outcome = await runGuarded(userId, [
    db
      .update(routines)
      .set({ isActive: false })
      .where(and(eq(routines.userId, userId), eq(routines.isActive, true))),
    db
      .update(routines)
      .set({ isActive: true })
      .where(and(eq(routines.id, routineId), eq(routines.userId, userId))),
  ]);
  return outcome === "locked" ? LOCKED : { ok: true };
}

export async function deactivateRoutine(
  userId: string,
  routineId: string,
): Promise<RoutineResult> {
  if (!(await getRoutine(userId, routineId))) return NOT_FOUND;
  const outcome = await runGuarded(userId, [
    db
      .update(routines)
      .set({ isActive: false })
      .where(and(eq(routines.id, routineId), eq(routines.userId, userId))),
  ]);
  return outcome === "locked" ? LOCKED : { ok: true };
}
