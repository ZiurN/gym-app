import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listCatalog } from "@/lib/catalog/queries";
import { buildRoutineCopy } from "@/lib/routines/copy";
import { newRoutineDraft } from "@/lib/routines/draft";
import { getOpenWorkout } from "@/lib/routines/open-workout";
import { getRoutine } from "@/lib/routines/service";
import { LockedNotice } from "@/components/routines/locked-notice";
import { RoutineBuilder } from "@/components/routines/routine-builder";

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function NewRoutinePage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  const user = await requireUser("/routines/new");

  const openWorkout = await getOpenWorkout(user.id);
  if (openWorkout) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <LockedNotice workout={openWorkout} />
      </main>
    );
  }

  const source = from ? await getRoutine(user.id, from) : null;
  if (from && !source) notFound();

  // A copy is only prefilled here; it becomes a routine when it is saved, so
  // its supersets are still free to regroup.
  const initial = source
    ? buildRoutineCopy(source, () => crypto.randomUUID())
    : newRoutineDraft(3, () => crypto.randomUUID());

  return (
    <RoutineBuilder
      heading={source ? "Duplicate routine" : "New routine"}
      initial={initial}
      catalog={await listCatalog()}
      savedSupersets={{}}
    />
  );
}
