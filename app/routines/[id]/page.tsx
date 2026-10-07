import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listCatalog } from "@/lib/catalog/queries";
import { savedSupersetsOf } from "@/lib/routines/draft";
import { getOpenWorkout } from "@/lib/routines/open-workout";
import { getRoutine } from "@/lib/routines/service";
import { LockedNotice } from "@/components/routines/locked-notice";
import { RoutineBuilder } from "@/components/routines/routine-builder";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRoutinePage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser(`/routines/${id}`);

  const routine = await getRoutine(user.id, id);
  if (!routine) notFound();

  const openWorkout = await getOpenWorkout(user.id);
  if (openWorkout) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <LockedNotice workout={openWorkout} />
      </main>
    );
  }

  return (
    <RoutineBuilder
      routineId={routine.id}
      heading="Edit routine"
      initial={{ name: routine.name, days: routine.days }}
      catalog={await listCatalog()}
      savedSupersets={savedSupersetsOf(routine)}
    />
  );
}
