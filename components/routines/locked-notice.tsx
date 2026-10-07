"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  abandonSessionAction,
  completeSessionAction,
} from "@/lib/workout/actions";

export type OpenWorkout = {
  sessionId: string;
  dayName: string;
  routineDayId: string | null;
  startedAt: string;
  setsLogged: number;
};

/** Shown instead of routine controls while a workout is open. */
export function LockedNotice({ workout }: { workout: OpenWorkout }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: (sessionId: string) => Promise<unknown>) =>
    startTransition(async () => {
      setError(null);
      try {
        await action(workout.sessionId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });

  const sets = `${workout.setsLogged} ${workout.setsLogged === 1 ? "set" : "sets"} logged`;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="size-5" aria-hidden="true" />
          Workout in progress
        </CardTitle>
        <CardDescription>
          Routines can&apos;t be changed while a workout is open. Finish or
          discard it first.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm">
          <span className="font-semibold">{workout.dayName}</span>
          <span className="text-muted-foreground">
            {" "}
            · started {workout.startedAt} · {sets}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {workout.routineDayId ? (
            <Button asChild>
              <Link href={`/entrenar/${workout.routineDayId}`}>Resume workout</Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => run(completeSessionAction)}
          >
            Finish and save
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Discard this workout? Its ${sets.replace(" logged", "")} will be deleted.`)) {
                run(abandonSessionAction);
              }
            }}
          >
            Discard workout
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
