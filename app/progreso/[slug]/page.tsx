import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { ExerciseInfoButton } from "@/components/exercises/exercise-info-button";
import { ProgressChart } from "@/components/workout/progress-chart";
import {
  formatDelta,
  formatMeasure,
  formatSetDetail,
  progressCaption,
} from "@/lib/workout/format-progress";
import { getExerciseBySlug } from "@/lib/catalog/queries";
import {
  getExerciseProgressPoints,
  progressDelta,
} from "@/lib/workout/queries";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ExerciseProgressPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await requireUser(`/progreso/${slug}`);
  const exercise = await getExerciseBySlug(slug);
  if (!exercise) notFound();

  const points = await getExerciseProgressPoints(user.id, exercise);
  const last = points.at(-1) ?? null;
  const delta = progressDelta(points);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-sm">
        <Link href="/progreso" className="text-muted-foreground hover:text-foreground">
          Progreso
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
      <ExerciseInfoButton
        slug={exercise.slug}
        name={exercise.name}
        text="Cómo se hace este ejercicio"
      />

      {last == null ? (
        <p className="mt-6 max-w-prose text-muted-foreground">
          Aún no hay sesiones completadas de {exercise.name}.{" "}
          <Link href="/entrenar" className="text-foreground underline underline-offset-4">
            Empezar un entrenamiento
          </Link>
        </p>
      ) : (
        <div className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-5xl font-semibold tracking-tight tabular-nums">
              {formatMeasure(last.value, last.unit)}
            </p>
            {delta != null ? (
              <p
                className={`tabular-nums ${
                  delta > 0 ? "text-lift" : delta < 0 ? "text-drop" : "text-muted-foreground"
                }`}
              >
                {formatDelta(delta, last.unit)}
              </p>
            ) : null}
          </div>
          <p className="mt-2 text-muted-foreground">{progressCaption(last)}</p>

          {last.left || last.right ? (
            <p className="mt-3 tabular-nums text-muted-foreground">
              {formatSetDetail(last)}
            </p>
          ) : null}

          {points.length === 1 ? (
            <p className="mt-8 text-muted-foreground">
              Con otra sesión completada verás la tendencia.
            </p>
          ) : (
            <div className="mt-8">
              <ProgressChart points={points} />
            </div>
          )}

          <ul className="mt-8 border-t border-border">
            {points.map((point) => (
              <li
                key={point.date}
                className="flex items-baseline justify-between gap-4 border-b border-border py-3 text-sm"
              >
                <span className="text-muted-foreground">{point.label}</span>
                <span className="tabular-nums">{formatSetDetail(point)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
