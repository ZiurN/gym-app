import Link from "next/link";
import { ExerciseInfoButton } from "@/components/exercises/exercise-info-button";
import { requireUser } from "@/lib/auth/session";
import { formatLatest } from "@/lib/workout/format-progress";
import { getLoggedExercises } from "@/lib/workout/queries";
import { getActiveRoutine } from "@/lib/routines/service";
import { getLastWorkouts, workoutDateLabel } from "@/lib/workout/history";
import { ChevronRight } from "lucide-react";

export default async function ProgresoIndexPage() {
  const user = await requireUser("/progress");
  const [logged, routine] = await Promise.all([
    getLoggedExercises(user.id),
    getActiveRoutine(user.id),
  ]);
  const lastWorkouts = routine
    ? await getLastWorkouts(user.id, routine.days)
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="mt-2 text-muted-foreground">
          Only finished workouts count.
        </p>
      </header>

      {lastWorkouts.length > 0 ? (
        <section className="mb-10 max-w-3xl">
          <h2 className="mb-3 text-lg font-semibold">Last workouts</h2>
          <ul className="border-y border-border">
            {lastWorkouts.map(({ dayId, dayName, completedAt }) => (
              <li key={dayId} className="border-b border-border last:border-b-0">
                {completedAt ? (
                  <Link
                    href={`/progress/days/${dayId}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm hover:text-foreground"
                  >
                    <span className="font-medium">{dayName}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      {workoutDateLabel(completedAt)}
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="font-medium">{dayName}</span>
                    <span className="text-muted-foreground">Not done yet</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h2 className="mb-3 text-lg font-semibold">By exercise</h2>
      {logged.length === 0 ? (
        <p className="max-w-prose text-muted-foreground">
          No finished workouts yet.{" "}
          <Link href="/train" className="text-foreground underline underline-offset-4">
            Start a workout
          </Link>
        </p>
      ) : (
        <ul className="max-w-3xl border-y border-border">
          {logged.map(({ exercise, latest }) => (
            <li
              key={exercise.id}
              className="flex items-center gap-2 border-b border-border last:border-b-0"
            >
              <Link
                href={`/progress/${exercise.slug}`}
                className="flex flex-1 items-baseline justify-between gap-4 py-3 text-sm hover:text-foreground"
              >
                <span>{exercise.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatLatest(latest ?? undefined)}
                </span>
              </Link>
              <ExerciseInfoButton
                slug={exercise.slug}
                name={exercise.name}
                label={`About ${exercise.name}`}
                className="shrink-0"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
