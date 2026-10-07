"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  activateRoutineAction,
  deactivateRoutineAction,
  deleteRoutineAction,
} from "@/lib/routines/actions";
import type { RoutineResult, RoutineSummary } from "@/lib/routines/types";

type RoutineListProps = {
  routines: RoutineSummary[];
  /** True while a workout is open: every change is blocked. */
  locked: boolean;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function RoutineList({ routines, locked }: RoutineListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  const run = (id: string, action: (id: string) => Promise<RoutineResult>) =>
    startTransition(async () => {
      setError(null);
      const result = await action(id);
      if (!result.ok) setError({ id, message: result.message });
      // Also when it failed: a "locked" answer means the page is out of date.
      router.refresh();
    });

  const disabled = pending || locked;

  if (routines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">No routines yet</CardTitle>
          <CardDescription>
            Choose how many days you train, add the exercises you do on each
            day, and start logging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locked ? (
            <Button disabled>Create your first routine</Button>
          ) : (
            <Button asChild>
              <Link href="/routines/new">Create your first routine</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {routines.map((routine) => {
        const hasEmptyDay = routine.emptyDayNames.length > 0;
        return (
          <Card key={routine.id} className={routine.isActive ? "border-2 border-primary" : undefined}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xl">{routine.name}</CardTitle>
                {routine.isActive ? <Badge>Active</Badge> : null}
              </div>
              <CardDescription>
                {plural(routine.dayCount, "day")} · {plural(routine.exerciseCount, "exercise")}
                {hasEmptyDay
                  ? ` · no exercises yet in ${routine.emptyDayNames.join(", ")}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                {routine.isActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => run(routine.id, deactivateRoutineAction)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={disabled || hasEmptyDay}
                    onClick={() => run(routine.id, activateRoutineAction)}
                  >
                    Activate
                  </Button>
                )}
                {locked ? (
                  <>
                    <Button variant="outline" disabled>Edit</Button>
                    <Button variant="outline" disabled>Duplicate</Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline">
                      <Link href={`/routines/${routine.id}`}>Edit</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/routines/new?from=${routine.id}`}>Duplicate</Link>
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  disabled={disabled}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete "${routine.name}"? Workouts you already logged are kept.`,
                      )
                    ) {
                      run(routine.id, deleteRoutineAction);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
              {hasEmptyDay && !routine.isActive ? (
                <p className="text-sm text-muted-foreground">
                  Every day needs at least one exercise before this routine can
                  be activated.
                </p>
              ) : null}
              {error?.id === routine.id ? (
                <p className="text-sm text-destructive">{error.message}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {locked ? (
        <Button variant="outline" disabled className="h-12 border-dashed">
          <Plus aria-hidden="true" />
          New routine
        </Button>
      ) : (
        <Button asChild variant="outline" className="h-12 border-dashed">
          <Link href="/routines/new">
            <Plus aria-hidden="true" />
            New routine
          </Link>
        </Button>
      )}
    </div>
  );
}
