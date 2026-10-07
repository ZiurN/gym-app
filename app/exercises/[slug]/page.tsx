import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getExerciseDetails } from "@/lib/catalog/queries";
import { ExerciseInfo } from "@/components/exercises/exercise-info";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ExercisePage({ params }: PageProps) {
  const { slug } = await params;
  await requireUser(`/exercises/${slug}`);

  const exercise = await getExerciseDetails(slug);
  if (!exercise) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <ExerciseInfo exercise={exercise} />
    </main>
  );
}
