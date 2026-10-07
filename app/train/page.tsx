import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getActiveRoutine } from "@/lib/routines/service";
import { suggestNextDayId } from "@/lib/workout/next-day";
import {
  getInProgressSession,
  getLastCompletedDayId,
} from "@/lib/workout/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell } from "lucide-react";

export default async function EntrenarPage() {
  const user = await requireUser("/train");
  const [inProgress, routine] = await Promise.all([
    getInProgressSession(user.id),
    getActiveRoutine(user.id),
  ]);
  const dayIds = routine?.days.map((day) => day.id) ?? [];
  const nextDayId = suggestNextDayId(
    dayIds,
    await getLastCompletedDayId(user.id, dayIds),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <Badge variant="secondary" className="mb-3">
          Live logging
        </Badge>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Dumbbell className="size-8 text-primary" />
          Train
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {routine
            ? `Active routine: ${routine.name}. You can start any day; only finished workouts are saved.`
            : "Pick a routine to start logging your workouts."}
        </p>
      </header>

      {inProgress?.routineDayId ? (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              Workout in progress · {inProgress.dayName}
            </CardTitle>
            <CardDescription>
              You have an unfinished workout. Resume it, or start another day
              (the unfinished one will be discarded).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/train/${inProgress.routineDayId}`}>Resume</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {routine ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {routine.days.map((day) => {
            const isNext = day.id === nextDayId;
            return (
              <Card key={day.id} className={isNext ? "border-2 border-primary" : undefined}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{day.name}</CardTitle>
                    {isNext ? <Badge>Next</Badge> : null}
                  </div>
                  <CardDescription>
                    {day.exercises.length}{" "}
                    {day.exercises.length === 1 ? "exercise" : "exercises"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant={isNext ? "default" : "outline"}>
                    <Link href={`/train/${day.id}`}>Start</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No active routine</CardTitle>
            <CardDescription>
              Create a routine with the days and exercises you train, or
              activate one you already saved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/routines">Go to routines</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="mt-8 text-sm">
        <Link href="/progress" className="text-primary underline-offset-4 hover:underline">
          See progress by exercise
        </Link>
      </p>
    </main>
  );
}
