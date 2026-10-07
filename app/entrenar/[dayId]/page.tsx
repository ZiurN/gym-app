import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { startOrResumeSession } from "@/lib/workout/session-service";
import {
  getDayPositions,
  getPrefills,
  getSessionSets,
} from "@/lib/workout/queries";
import { WorkoutSessionClient } from "@/components/workout/workout-session-client";

type PageProps = {
  params: Promise<{ dayId: string }>;
};

export default async function LiveWorkoutPage({ params }: PageProps) {
  const { dayId } = await params;
  const user = await requireUser(`/entrenar/${dayId}`);

  const started = await startOrResumeSession(user.id, dayId, true);
  if (started.status !== "ready") notFound();

  const [positions, sets] = await Promise.all([
    getDayPositions(dayId),
    getSessionSets(started.sessionId),
  ]);
  const prefills = await getPrefills(
    user.id,
    positions.flatMap((position) =>
      position.alternative
        ? [position.exercise.id, position.alternative.id]
        : [position.exercise.id],
    ),
  );

  return (
    <WorkoutSessionClient
      sessionId={started.sessionId}
      dayTitle={started.dayName}
      positions={positions}
      initialSets={sets.map((s) => ({
        id: s.id,
        exerciseId: s.exerciseId,
        setIndex: s.setIndex,
        side: s.side,
        load: s.load,
        weightUnit: s.weightUnit,
        reps: s.reps,
        durationSec: s.durationSec,
      }))}
      prefills={prefills}
    />
  );
}
