"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startSessionAction } from "@/lib/workout/actions";

type StartWorkoutButtonProps = {
  dayId: string;
  label?: string;
  variant?: "default" | "outline";
  className?: string;
};

/** Starts a day's workout; asks before discarding another open one. */
export function StartWorkoutButton({
  dayId,
  label = "Start",
  variant = "default",
  className,
}: StartWorkoutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const start = () =>
    startTransition(async () => {
      setError(null);
      try {
        let result = await startSessionAction(dayId);
        if (result.status === "conflict") {
          if (
            !window.confirm(
              "You have an unfinished workout. Discard it and start this day?",
            )
          ) {
            return;
          }
          result = await startSessionAction(dayId, true);
        }
        if (result.status !== "ready") {
          setError("This day is no longer in your active routine.");
          return;
        }
        router.push(`/train/${dayId}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={pending}
        onClick={start}
      >
        {pending ? "Starting…" : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
