import { getInProgressSession, getSessionSets } from "@/lib/workout/queries";

/** The workout that currently locks the user's routines, if any. */
export async function getOpenWorkout(userId: string) {
  const session = await getInProgressSession(userId);
  if (!session) return null;
  const sets = await getSessionSets(session.id);
  return {
    sessionId: session.id,
    dayName: session.dayName,
    routineDayId: session.routineDayId,
    startedAt: session.startedAt.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    setsLogged: sets.length,
  };
}
