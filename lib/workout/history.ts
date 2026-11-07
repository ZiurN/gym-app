import { and, desc, eq, inArray } from "drizzle-orm";
import { getExercisesByIds } from "@/lib/catalog/queries";
import { db } from "@/lib/db";
import { workoutSessions } from "@/lib/db/schema";
import { getDayPositions, getSessionSets } from "@/lib/workout/queries";
import { getActiveRoutineDay } from "@/lib/workout/session-service";
import type {
  LoggedSet,
  SessionExerciseRef,
  SessionPosition,
} from "@/lib/workout/types";

export type LastWorkoutRow = {
  dayId: string;
  dayName: string;
  completedAt: Date | null;
};

export type PastExercise = {
  exercise: SessionExerciseRef;
  supersetGroup: number | null;
  /** Done instead of the planned exercise. */
  isAlternative: boolean;
  /** No longer part of the day. */
  removed: boolean;
  sets: LoggedSet[];
  skipped: number;
};

export type PastWorkout = {
  dayName: string;
  startedAt: Date;
  completedAt: Date;
  setsDone: number;
  setsPlanned: number;
  exercises: PastExercise[];
};

/** Most recent completed session of each routine day, keyed by day id. */
async function lastCompletedSessions(userId: string, dayIds: string[]) {
  if (dayIds.length === 0) return [];
  return db
    .selectDistinctOn([workoutSessions.routineDayId])
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed"),
        inArray(workoutSessions.routineDayId, dayIds),
      ),
    )
    .orderBy(workoutSessions.routineDayId, desc(workoutSessions.completedAt));
}

/**
 * The given days (those of the active routine) with the date each was last
 * completed: newest first, then days not done yet in routine order.
 */
export async function getLastWorkouts(
  userId: string,
  days: { id: string; name: string }[],
): Promise<LastWorkoutRow[]> {
  const sessions = await lastCompletedSessions(
    userId,
    days.map((day) => day.id),
  );
  const rows = days.map((day) => ({
    dayId: day.id,
    dayName: day.name,
    completedAt:
      sessions.find((session) => session.routineDayId === day.id)?.completedAt ??
      null,
  }));
  const done = rows
    .filter((row) => row.completedAt != null)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  return [...done, ...rows.filter((row) => row.completedAt == null)];
}

const plannedSlots = (position: SessionPosition, exercise: SessionExerciseRef) =>
  position.targetSets * (exercise.modality === "per_side" ? 2 : 1);

/**
 * A past session's sets grouped like the live screen: the day's entries in
 * order (with the exercise actually done), then exercises no longer planned.
 */
export function groupPastWorkout(
  positions: SessionPosition[],
  sets: LoggedSet[],
  removedRefs: Map<string, SessionExerciseRef>,
): { exercises: PastExercise[]; setsPlanned: number } {
  const setsOf = (exerciseId: string) =>
    sets.filter((set) => set.exerciseId === exerciseId);
  const placed = new Set<string>();
  const exercises: PastExercise[] = [];

  for (const position of positions) {
    const main = setsOf(position.exercise.id);
    const alt = position.alternative ? setsOf(position.alternative.id) : [];
    const done =
      position.alternative && alt.length > 0 && main.length === 0
        ? { exercise: position.alternative, sets: alt, isAlternative: true }
        : { exercise: position.exercise, sets: main, isAlternative: false };
    const planned = plannedSlots(position, done.exercise);
    placed.add(position.exercise.id);
    if (position.alternative) placed.add(position.alternative.id);

    exercises.push({
      ...done,
      supersetGroup: position.supersetGroup,
      removed: false,
      skipped: Math.max(0, planned - done.sets.length),
    });
    // Both done in one session: show the alternative's sets too.
    if (!done.isAlternative && position.alternative && alt.length > 0) {
      exercises.push({
        exercise: position.alternative,
        sets: alt,
        isAlternative: true,
        supersetGroup: position.supersetGroup,
        removed: false,
        skipped: 0,
      });
    }
  }

  // Sets come in the order they were done, so first-seen is that order.
  for (const set of sets) {
    if (placed.has(set.exerciseId)) continue;
    placed.add(set.exerciseId);
    const exercise = removedRefs.get(set.exerciseId);
    if (!exercise) continue;
    exercises.push({
      exercise,
      supersetGroup: null,
      isAlternative: false,
      removed: true,
      sets: setsOf(set.exerciseId),
      skipped: 0,
    });
  }

  // Planned as the day is now, plus whatever was done beyond that plan.
  const setsPlanned = exercises.reduce(
    (total, item) => total + item.sets.length + item.skipped,
    0,
  );
  return { exercises, setsPlanned };
}

/** The last completed workout of a day of the user's active routine. */
export async function getLastWorkoutForDay(
  userId: string,
  dayId: string,
): Promise<{ day: { id: string; name: string }; workout: PastWorkout | null } | null> {
  const day = await getActiveRoutineDay(userId, dayId);
  if (!day) return null;
  const [session] = await lastCompletedSessions(userId, [dayId]);
  if (!session?.completedAt) return { day, workout: null };

  const [positions, rows] = await Promise.all([
    getDayPositions(dayId),
    getSessionSets(session.id),
  ]);
  const sets: LoggedSet[] = rows.map((row) => ({
    id: row.id,
    exerciseId: row.exerciseId,
    setIndex: row.setIndex,
    side: row.side,
    load: row.load,
    weightUnit: row.weightUnit,
    reps: row.reps,
    durationSec: row.durationSec,
  }));
  const planned = new Set(
    positions.flatMap((p) => (p.alternative ? [p.exercise.id, p.alternative.id] : [p.exercise.id])),
  );
  const catalog = await getExercisesByIds(
    sets.map((set) => set.exerciseId).filter((id) => !planned.has(id)),
  );
  const removedRefs = new Map(
    [...catalog.values()].map((e) => [
      e.id,
      { id: e.id, slug: e.slug, name: e.name, modality: e.modality },
    ]),
  );
  const { exercises, setsPlanned } = groupPastWorkout(positions, sets, removedRefs);

  return {
    day,
    workout: {
      dayName: session.dayName,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      setsDone: sets.length,
      setsPlanned,
      exercises,
    },
  };
}

/** "Sat, Oct 17". */
export function workoutDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
