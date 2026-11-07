import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDayState } from "@/lib/workout/session-service";
import { getLastWorkouts, workoutDateLabel } from "@/lib/workout/history";
import {
  getDayPositions,
  getPrefills,
  getSessionSets,
} from "@/lib/workout/queries";
import type { SessionPosition } from "@/lib/workout/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StartWorkoutButton } from "@/components/workout/start-workout-button";
import { WorkoutSessionClient } from "@/components/workout/workout-session-client";

type PageProps = {
  params: Promise<{ dayId: string }>;
};

function planLine(position: SessionPosition) {
  const { targetSets, repMin, repMax } = position;
  const sets = `${targetSets} ${targetSets === 1 ? "set" : "sets"}`;
  if (repMin != null && repMax != null) {
    return `${sets} · ${repMin === repMax ? repMin : `${repMin}–${repMax}`} reps`;
  }
  if (repMin != null) return `${sets} · ${repMin}+ reps`;
  if (repMax != null) return `${sets} · up to ${repMax} reps`;
  return sets;
}

export default async function LiveWorkoutPage({ params }: PageProps) {
  const { dayId } = await params;
  const user = await requireUser(`/train/${dayId}`);

  const state = await getDayState(user.id, dayId);
  if (!state) notFound();

  const positions = await getDayPositions(dayId);

  if (!state.session) {
    const { otherOpen } = state;
    const [last] = await getLastWorkouts(user.id, [state.day]);
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-6 pb-28 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/train">
            <ChevronLeft className="mr-1 size-4" />
            Train
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{state.day.name}</h1>
        {last?.completedAt ? (
          <Link
            href={`/progress/days/${dayId}`}
            className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
          >
            Last time · {workoutDateLabel(last.completedAt)}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
        <div className="mb-4" />

        {otherOpen ? (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">
                Workout in progress · {otherOpen.dayName}
              </CardTitle>
              <CardDescription>
                Starting this day discards the unfinished one.
              </CardDescription>
            </CardHeader>
            {otherOpen.routineDayId ? (
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={`/train/${otherOpen.routineDayId}`}>
                    Resume {otherOpen.dayName}
                  </Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        <ol className="mb-6 grid gap-2">
          {positions.map((position) => (
            <li
              key={position.id}
              className="rounded-xl border px-4 py-3"
            >
              <div className="font-semibold">{position.exercise.name}</div>
              <div className="text-sm text-muted-foreground">
                {planLine(position)}
                {position.alternative ? ` · or ${position.alternative.name}` : ""}
              </div>
            </li>
          ))}
        </ol>

        <StartWorkoutButton dayId={dayId} label="Start workout" className="h-14 w-full text-lg" />
      </main>
    );
  }

  const sessionId = state.session.id;
  const [sets, prefills] = await Promise.all([
    getSessionSets(sessionId),
    getPrefills(
      user.id,
      positions.flatMap((position) =>
        position.alternative
          ? [position.exercise.id, position.alternative.id]
          : [position.exercise.id],
      ),
    ),
  ]);

  return (
    <WorkoutSessionClient
      sessionId={sessionId}
      dayTitle={state.session.dayName}
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
