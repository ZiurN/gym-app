import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { PG_UNIQUE_VIOLATION, pgErrorCode } from "@/lib/db/errors";
import {
  exercisePreferences,
  routineDays,
  routines,
  workoutSessions,
  workoutSets,
} from "@/lib/db/schema";
import {
  getDayPositions,
  getInProgressSession,
  getSessionById,
  getSessionSets,
} from "@/lib/workout/queries";
import type { CompletedSetInput } from "@/lib/workout/types";

/** The day if it belongs to the user's active routine. */
async function getActiveRoutineDay(userId: string, routineDayId: string) {
  const [day] = await db
    .select({ id: routineDays.id, name: routineDays.name })
    .from(routineDays)
    .innerJoin(routines, eq(routines.id, routineDays.routineId))
    .where(
      and(
        eq(routineDays.id, routineDayId),
        eq(routines.userId, userId),
        eq(routines.isActive, true),
      ),
    )
    .limit(1);
  return day ?? null;
}

export async function abandonSessionForUser(
  userId: string,
  sessionId: string,
) {
  const session = await getSessionById(userId, sessionId);
  if (!session || session.status !== "in_progress") {
    return { ok: true as const, routineDayId: session?.routineDayId ?? null };
  }

  // Its sets go with it (cascade), so nothing is left behind.
  await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));

  return { ok: true as const, routineDayId: session.routineDayId };
}

export async function startOrResumeSession(
  userId: string,
  routineDayId: string,
  replaceExisting = false,
) {
  const day = await getActiveRoutineDay(userId, routineDayId);
  if (!day) {
    return { status: "not_available" as const };
  }

  const existing = await getInProgressSession(userId);

  if (existing?.routineDayId === routineDayId) {
    return { status: "ready" as const, sessionId: existing.id, dayName: existing.dayName };
  }

  if (existing && !replaceExisting) {
    return {
      status: "conflict" as const,
      existingDayId: existing.routineDayId,
      sessionId: existing.id,
    };
  }

  if (existing) {
    await abandonSessionForUser(userId, existing.id);
  }

  try {
    const [session] = await db
      .insert(workoutSessions)
      .values({
        userId,
        routineDayId,
        dayName: day.name,
        status: "in_progress",
      })
      .returning();
    return { status: "ready" as const, sessionId: session.id, dayName: session.dayName };
  } catch (error) {
    // Two starts raced; the database lets only one session be in progress.
    if (pgErrorCode(error) !== PG_UNIQUE_VIOLATION) throw error;
    const winner = await getInProgressSession(userId);
    if (winner?.routineDayId === routineDayId) {
      return { status: "ready" as const, sessionId: winner.id, dayName: winner.dayName };
    }
    return {
      status: "conflict" as const,
      existingDayId: winner?.routineDayId ?? null,
      sessionId: winner?.id ?? "",
    };
  }
}

export async function completeSetForUser(
  userId: string,
  sessionId: string,
  input: CompletedSetInput,
) {
  const session = await getSessionById(userId, sessionId);
  if (!session || session.status !== "in_progress" || !session.routineDayId) {
    throw new Error("No hay una sesión activa.");
  }

  const [positions, logged] = await Promise.all([
    getDayPositions(session.routineDayId),
    getSessionSets(sessionId),
  ]);
  const position = positions.find(
    (p) =>
      p.exercise.id === input.exerciseId ||
      p.alternative?.id === input.exerciseId,
  );
  if (!position) {
    throw new Error("Ejercicio no válido.");
  }
  const isMain = position.exercise.id === input.exerciseId;
  const exercise = isMain ? position.exercise : position.alternative!;
  const other = isMain ? position.alternative : position.exercise;
  if (other && logged.some((set) => set.exerciseId === other.id)) {
    throw new Error(`Ya registraste series de ${other.name} en esta sesión.`);
  }

  const needsSide = exercise.modality === "per_side";
  if (
    !Number.isInteger(input.setIndex) ||
    input.setIndex < 1 ||
    input.setIndex > position.targetSets ||
    needsSide !== (input.side != null)
  ) {
    throw new Error("Serie no válida.");
  }

  if (input.weightUnit) {
    await db
      .insert(exercisePreferences)
      .values({
        userId,
        exerciseId: exercise.id,
        weightUnit: input.weightUnit,
      })
      .onConflictDoUpdate({
        target: [exercisePreferences.userId, exercisePreferences.exerciseId],
        set: { weightUnit: input.weightUnit },
      });
  }

  const [inserted] = await db
    .insert(workoutSets)
    .values({
      sessionId,
      userId,
      exerciseId: exercise.id,
      setIndex: input.setIndex,
      modality: exercise.modality,
      load: input.load ?? null,
      weightUnit: input.weightUnit ?? null,
      reps: input.reps ?? null,
      durationSec: input.durationSec ?? null,
      side: input.side ?? null,
    })
    .onConflictDoNothing()
    .returning();

  // A repeated "finished" for the same set (double tap, retry) returns the
  // set that is already there instead of creating a second one.
  const set =
    inserted ??
    (await getSessionSets(sessionId)).find(
      (s) =>
        s.exerciseId === exercise.id &&
        s.setIndex === input.setIndex &&
        (s.side ?? undefined) === input.side,
    );
  if (!set) throw new Error("No se pudo guardar el set.");

  return { set, routineDayId: session.routineDayId };
}

export async function completeSessionForUser(userId: string, sessionId: string) {
  const session = await getSessionById(userId, sessionId);
  if (!session || session.status !== "in_progress") {
    throw new Error("No hay una sesión activa para finalizar.");
  }

  await db
    .update(workoutSessions)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(workoutSessions.id, sessionId));

  return { routineDayId: session.routineDayId };
}

export async function deleteSetForUser(
  userId: string,
  sessionId: string,
  setId: string,
) {
  const session = await getSessionById(userId, sessionId);
  if (!session || session.status !== "in_progress") {
    throw new Error("Solo puedes editar sets en una sesión activa.");
  }

  await db
    .delete(workoutSets)
    .where(and(eq(workoutSets.id, setId), eq(workoutSets.sessionId, sessionId)));

  return { routineDayId: session.routineDayId };
}
