import Link from "next/link";
import { ExerciseInfoButton } from "@/components/exercises/exercise-info-button";
import { requireUser } from "@/lib/auth/session";
import { formatLatest } from "@/lib/workout/format-progress";
import { getLoggedExercises } from "@/lib/workout/queries";

export default async function ProgresoIndexPage() {
  const user = await requireUser("/progress");
  const logged = await getLoggedExercises(user.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="mt-2 text-muted-foreground">
          Only finished workouts count.
        </p>
      </header>

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
