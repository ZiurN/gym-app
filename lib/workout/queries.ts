import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getExercisesByIds } from "@/lib/catalog/queries";
import type { CatalogExercise } from "@/lib/catalog/types";
import { db } from "@/lib/db";
import {
  exercisePreferences,
  routineExercises,
  workoutSessions,
  workoutSets,
} from "@/lib/db/schema";
import type {
  ExerciseModality,
  Prefill,
  ProgressPoint,
  SessionPosition,
  SideLoad,
} from "@/lib/workout/types";

type WorkoutSetRow = typeof workoutSets.$inferSelect;

function sessionDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function bestByLoad(sets: WorkoutSetRow[]): WorkoutSetRow | null {
  const withLoad = sets.filter((set) => set.load != null);
  if (withLoad.length === 0) return null;
  return withLoad.reduce((best, current) =>
    (current.load ?? 0) > (best.load ?? 0) ? current : best,
  );
}

function toSideLoad(set: WorkoutSetRow | null): SideLoad | null {
  if (!set || set.load == null) return null;
  return { load: set.load, reps: set.reps };
}

function metricForExercise(
  modality: ExerciseModality,
  sets: WorkoutSetRow[],
  completedAt: Date,
): ProgressPoint | null {
  const label = sessionDateLabel(completedAt);
  const date = completedAt.toISOString();

  if (modality === "time") {
    const timed = sets.filter((set) => set.durationSec != null);
    if (timed.length === 0) return null;
    const best = timed.reduce((currentBest, current) =>
      (current.durationSec ?? 0) > (currentBest.durationSec ?? 0)
        ? current
        : currentBest,
    );
    return {
      date,
      label,
      value: best.durationSec ?? 0,
      unit: "s",
      reps: null,
      durationSec: best.durationSec,
      left: null,
      right: null,
    };
  }

  if (modality === "per_side") {
    const left = toSideLoad(bestByLoad(sets.filter((set) => set.side === "left")));
    const right = toSideLoad(
      bestByLoad(sets.filter((set) => set.side === "right")),
    );
    if (!left && !right) {
      const any = bestByLoad(sets);
      if (!any || any.load == null) return null;
      return {
        date,
        label,
        value: any.load,
        unit: any.weightUnit ?? "kg",
        reps: any.reps,
        durationSec: null,
        left: null,
        right: null,
      };
    }
    const value = Math.max(left?.load ?? 0, right?.load ?? 0);
    const unit =
      sets.find((set) => set.weightUnit)?.weightUnit ?? "kg";
    const reps =
      value === left?.load ? (left?.reps ?? null) : (right?.reps ?? null);
    return {
      date,
      label,
      value,
      unit,
      reps,
      durationSec: null,
      left,
      right,
    };
  }

  const top = bestByLoad(sets);
  if (!top || top.load == null) return null;
  return {
    date,
    label,
    value: top.load,
    unit: top.weightUnit ?? "kg",
    reps: top.reps,
    durationSec: null,
    left: null,
    right: null,
  };
}

export async function getInProgressSession(userId: string) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "in_progress"),
      ),
    )
    .limit(1);
  return session ?? null;
}

export async function getSessionById(userId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId),
      ),
    )
    .limit(1);
  return session ?? null;
}

export async function getSessionSets(sessionId: string) {
  return db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.sessionId, sessionId))
    .orderBy(workoutSets.completedAt);
}

/** The entries of a routine day, in order, with their catalog exercises. */
export async function getDayPositions(
  routineDayId: string,
): Promise<SessionPosition[]> {
  const rows = await db
    .select()
    .from(routineExercises)
    .where(eq(routineExercises.routineDayId, routineDayId))
    .orderBy(asc(routineExercises.position));
  const catalog = await getExercisesByIds(
    rows.flatMap((row) =>
      row.alternativeExerciseId
        ? [row.exerciseId, row.alternativeExerciseId]
        : [row.exerciseId],
    ),
  );
  const ref = (id: string) => {
    const exercise = catalog.get(id);
    if (!exercise) throw new Error("Exercise missing from the catalog.");
    return {
      id: exercise.id,
      slug: exercise.slug,
      name: exercise.name,
      modality: exercise.modality,
    };
  };
  return rows.map((row) => ({
    id: row.id,
    exercise: ref(row.exerciseId),
    alternative: row.alternativeExerciseId ? ref(row.alternativeExerciseId) : null,
    targetSets: row.targetSets,
    restSeconds: row.restSeconds,
    repMin: row.repMin,
    repMax: row.repMax,
    note: row.note,
    supersetGroup: row.supersetGroup,
  }));
}

/** Day of the user's most recently completed session among the given days. */
export async function getLastCompletedDayId(
  userId: string,
  dayIds: string[],
): Promise<string | null> {
  if (dayIds.length === 0) return null;
  const [session] = await db
    .select({ routineDayId: workoutSessions.routineDayId })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed"),
        inArray(workoutSessions.routineDayId, dayIds),
      ),
    )
    .orderBy(desc(workoutSessions.completedAt))
    .limit(1);
  return session?.routineDayId ?? null;
}

const completedSetsOf = (userId: string) =>
  and(eq(workoutSets.userId, userId), eq(workoutSessions.status, "completed"));

/**
 * Pre-fill values per exercise: the user's most recent set in a completed
 * session, in whichever day or routine it was logged, plus the unit they use.
 */
export async function getPrefills(
  userId: string,
  exerciseIds: string[],
): Promise<Record<string, Prefill>> {
  const ids = [...new Set(exerciseIds)];
  if (ids.length === 0) return {};

  const [lastSets, preferences] = await Promise.all([
    db
      .selectDistinctOn([workoutSets.exerciseId], {
        exerciseId: workoutSets.exerciseId,
        load: workoutSets.load,
        reps: workoutSets.reps,
        durationSec: workoutSets.durationSec,
        weightUnit: workoutSets.weightUnit,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
      .where(and(completedSetsOf(userId), inArray(workoutSets.exerciseId, ids)))
      .orderBy(workoutSets.exerciseId, desc(workoutSets.completedAt)),
    db
      .select()
      .from(exercisePreferences)
      .where(
        and(
          eq(exercisePreferences.userId, userId),
          inArray(exercisePreferences.exerciseId, ids),
        ),
      ),
  ]);

  const result: Record<string, Prefill> = {};
  for (const id of ids) {
    const last = lastSets.find((set) => set.exerciseId === id);
    const preferred = preferences.find((p) => p.exerciseId === id)?.weightUnit;
    result[id] = {
      load: last?.load ?? undefined,
      reps: last?.reps ?? undefined,
      durationSec: last?.durationSec ?? undefined,
      weightUnit: last?.weightUnit ?? preferred ?? "kg",
    };
  }
  return result;
}

/** One point per completed session in which the user logged the exercise. */
export async function getExerciseProgressPoints(
  userId: string,
  exercise: Pick<CatalogExercise, "id" | "modality">,
): Promise<ProgressPoint[]> {
  const rows = await db
    .select({ set: workoutSets, sessionCompletedAt: workoutSessions.completedAt })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .where(and(completedSetsOf(userId), eq(workoutSets.exerciseId, exercise.id)))
    .orderBy(asc(workoutSessions.completedAt));

  const bySession = new Map<string, { completedAt: Date; sets: WorkoutSetRow[] }>();
  for (const { set, sessionCompletedAt } of rows) {
    if (sessionCompletedAt == null) continue;
    const entry = bySession.get(set.sessionId) ?? {
      completedAt: sessionCompletedAt,
      sets: [],
    };
    entry.sets.push(set);
    bySession.set(set.sessionId, entry);
  }

  return [...bySession.values()]
    .map(({ completedAt, sets }) =>
      metricForExercise(exercise.modality, sets, completedAt),
    )
    .filter((point): point is ProgressPoint => point != null);
}

export function progressDelta(points: ProgressPoint[]): number | null {
  if (points.length < 2) return null;
  const previous = points[points.length - 2];
  const last = points[points.length - 1];
  if (previous.unit !== last.unit) return null;
  return last.value - previous.value;
}

/**
 * Every exercise the user has logged in a completed session, whether or not
 * it is in a current routine, with the point of its latest session.
 */
export async function getLoggedExercises(
  userId: string,
): Promise<{ exercise: CatalogExercise; latest: ProgressPoint | null }[]> {
  const latestSessions = await db
    .selectDistinctOn([workoutSets.exerciseId], {
      exerciseId: workoutSets.exerciseId,
      sessionId: workoutSets.sessionId,
      completedAt: workoutSessions.completedAt,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .where(completedSetsOf(userId))
    .orderBy(workoutSets.exerciseId, desc(workoutSets.completedAt));
  if (latestSessions.length === 0) return [];

  const [sets, catalog] = await Promise.all([
    db
      .select()
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.userId, userId),
          inArray(workoutSets.sessionId, [
            ...new Set(latestSessions.map((row) => row.sessionId)),
          ]),
        ),
      ),
    getExercisesByIds(latestSessions.map((row) => row.exerciseId)),
  ]);

  return latestSessions
    .flatMap((row) => {
      const exercise = catalog.get(row.exerciseId);
      if (!exercise || row.completedAt == null) return [];
      const ownSets = sets.filter(
        (set) => set.sessionId === row.sessionId && set.exerciseId === row.exerciseId,
      );
      return [
        {
          exercise,
          latest: metricForExercise(exercise.modality, ownSets, row.completedAt),
        },
      ];
    })
    .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));
}
