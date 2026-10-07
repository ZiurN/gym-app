"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type RestTimerProps = {
  restSeconds: number;
  onDone: () => void;
  onSkip: () => void;
};

export function RestTimer({ restSeconds, onDone, onSkip }: RestTimerProps) {
  // The parent remounts this (via `key`) for every rest, so the end time is
  // fixed at mount and only "+30 s" moves it.
  const [endsAt, setEndsAt] = useState(() => Date.now() + restSeconds * 1000);
  const [remaining, setRemaining] = useState(restSeconds);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) onDone();
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt, onDone]);

  const progress =
    restSeconds > 0 ? ((restSeconds - remaining) / restSeconds) * 100 : 100;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Rest</p>
            <p className="text-2xl font-bold tabular-nums">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onSkip}>
              Skip
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setEndsAt(Date.now() + 30_000)}
            >
              +30 s
            </Button>
          </div>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  );
}
