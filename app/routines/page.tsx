import { requireUser } from "@/lib/auth/session";
import { getOpenWorkout } from "@/lib/routines/open-workout";
import { listRoutines } from "@/lib/routines/service";
import { LockedNotice } from "@/components/routines/locked-notice";
import { RoutineList } from "@/components/routines/routine-list";

export default async function RoutinesPage() {
  const user = await requireUser("/routines");
  const [routines, openWorkout] = await Promise.all([
    listRoutines(user.id),
    getOpenWorkout(user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Routines</h1>
        <p className="mt-2 text-muted-foreground">
          Keep as many as you like. The active one is what you train.
        </p>
      </header>
      <div className="grid gap-6">
        {openWorkout ? <LockedNotice workout={openWorkout} /> : null}
        <RoutineList routines={routines} locked={openWorkout != null} />
      </div>
    </main>
  );
}
