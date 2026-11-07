import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseInfoButton } from "@/components/exercises/exercise-info-button";
import { loggedSetFigures } from "@/components/workout/logged-set-figures";
import { getLastWorkoutForDay, workoutDateLabel } from "@/lib/workout/history";
import type { LoggedSet } from "@/lib/workout/types";

type PageProps = {
  params: Promise<{ dayId: string }>;
};

function setLabel(set: LoggedSet) {
  if (set.side === "left") return `Set ${set.setIndex} · left`;
  if (set.side === "right") return `Set ${set.setIndex} · right`;
  return `Set ${set.setIndex}`;
}

const bySlot = (a: LoggedSet, b: LoggedSet) =>
  a.setIndex - b.setIndex || (a.side ?? "").localeCompare(b.side ?? "");

export default async function LastWorkoutPage({ params }: PageProps) {
  const { dayId } = await params;
  const user = await requireUser(`/progress/days/${dayId}`);
  const result = await getLastWorkoutForDay(user.id, dayId);
  if (!result?.workout) notFound();
  const { workout } = result;

  const minutes = Math.max(
    1,
    Math.round((workout.completedAt.getTime() - workout.startedAt.getTime()) / 60000),
  );

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6 pb-28 sm:px-6">
      <div className="mb-6 text-sm">
        <Link href="/progress" className="text-muted-foreground hover:text-foreground">
          Progress
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{result.day.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last workout · {workoutDateLabel(workout.completedAt)} ·{" "}
          {workout.setsDone} of {workout.setsPlanned} sets · {minutes} min
        </p>
      </header>

      <section className="grid gap-3">
        {workout.exercises.map((item) => (
          <Card key={`${item.exercise.id}:${item.isAlternative}`}>
            <CardHeader className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="grid gap-1">
                  <CardTitle className="text-base">{item.exercise.name}</CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {item.supersetGroup != null ? (
                      <Badge variant="secondary">Superset</Badge>
                    ) : null}
                    {item.isAlternative ? (
                      <Badge variant="secondary">Alternative</Badge>
                    ) : null}
                    {item.removed ? (
                      <Badge variant="outline">No longer in this day</Badge>
                    ) : null}
                  </div>
                </div>
                <ExerciseInfoButton
                  slug={item.exercise.slug}
                  name={item.exercise.name}
                  label={`About ${item.exercise.name}`}
                  className="shrink-0"
                />
              </div>
            </CardHeader>
            <CardContent className="grid gap-1 pb-3 text-sm">
              {[...item.sets].sort(bySlot).map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <span>{setLabel(set)}</span>
                  <span className="tabular-nums">{loggedSetFigures(set)}</span>
                </div>
              ))}
              {item.skipped > 0 ? (
                <p className="px-3 py-1 text-muted-foreground">
                  {item.skipped} {item.skipped === 1 ? "set" : "sets"} skipped
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
