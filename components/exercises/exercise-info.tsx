import Image from "next/image";
import Link from "next/link";
import { MuscleMap, MuscleMapSwatch } from "@/components/exercises/muscle-map";
import { muscleRegionsOf } from "@/lib/catalog/muscle-map";
import { capitalize, labelFor, type ExerciseDetails } from "@/lib/catalog/types";

type ExerciseInfoProps = {
  exercise: ExerciseDetails;
  /** Heading level of the exercise name: a page uses h1, the modal h2. */
  as?: "h1" | "h2";
  /** Off in the modal: following it would leave the screen underneath. */
  progressLink?: boolean;
};

/** Everything the app knows about one exercise. Used as a page and in an overlay. */
export function ExerciseInfo({
  exercise,
  as: Heading = "h1",
  progressLink = true,
}: ExerciseInfoProps) {
  const regions = muscleRegionsOf(exercise);
  const target = exercise.targetMuscle ? capitalize(exercise.targetMuscle) : null;
  const secondary = exercise.secondaryMuscles.map(capitalize);
  const equipment = capitalize(exercise.equipmentDetail ?? labelFor(exercise.equipment));
  const mapLabel = [
    "Muscle map.",
    target ? `Target: ${target}.` : "",
    secondary.length > 0 ? `Secondary: ${secondary.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="grid gap-6">
      <header className="grid gap-1">
        <Heading className="text-2xl font-bold tracking-tight">{exercise.name}</Heading>
        <p className="text-muted-foreground">
          {labelFor(exercise.primaryMuscle)} · {equipment}
        </p>
      </header>

      <section aria-label="Muscles" className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-center">
        <MuscleMap target={regions.target} secondary={regions.secondary} label={mapLabel} />
        <dl className="grid gap-3 text-sm">
          {target ? (
            <div>
              <dt className="font-semibold">
                <MuscleMapSwatch level="target" /> Target
              </dt>
              <dd className="text-muted-foreground">{target}</dd>
            </div>
          ) : null}
          {secondary.length > 0 ? (
            <div>
              <dt className="font-semibold">
                <MuscleMapSwatch level="secondary" /> Secondary
              </dt>
              <dd className="text-muted-foreground">{secondary.join(", ")}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-semibold">Equipment</dt>
            <dd className="text-muted-foreground">{equipment}</dd>
          </div>
        </dl>
      </section>

      {exercise.hasPhotos ? (
        <section aria-label="Photos" className="grid grid-cols-2 gap-3">
          {(["start", "end"] as const).map((position) => (
            <figure key={position} className="grid gap-1.5">
              <Image
                src={`/exercise-photos/${exercise.slug}/${position}.webp`}
                alt={`${exercise.name}, ${position} position`}
                width={480}
                height={320}
                unoptimized
                className="h-auto w-full rounded-md border"
              />
              <figcaption className="text-sm font-medium">
                {position === "start" ? "Start" : "End"}
              </figcaption>
            </figure>
          ))}
        </section>
      ) : null}

      <section aria-label="How it is performed" className="grid gap-3">
        <h3 className="text-lg font-semibold">How it is performed</h3>
        {exercise.steps.length > 0 ? (
          <ol className="grid list-decimal gap-2 pl-5 leading-relaxed">
            {exercise.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">No description available for this exercise.</p>
        )}
        <p className="text-sm text-muted-foreground">
          General information about how the movement is performed. It is not
          personal advice.
        </p>
      </section>

      {progressLink ? (
        <p className="text-sm">
          <Link href={`/progreso/${exercise.slug}`} className="text-primary underline-offset-4 hover:underline">
            Your progress on this exercise
          </Link>
        </p>
      ) : null}
    </article>
  );
}
