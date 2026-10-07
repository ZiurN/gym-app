"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseInfo } from "@/components/exercises/exercise-info";
import { getExerciseDetailsAction } from "@/lib/catalog/actions";
import type { ExerciseDetails } from "@/lib/catalog/types";

type State =
  | { status: "loading" }
  | { status: "ready"; exercise: ExerciseDetails }
  | { status: "missing" }
  | { status: "error" };

function Overlay({ slug, name, onClose }: { slug: string; name: string; onClose: () => void }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let current = true;
    getExerciseDetailsAction(slug).then(
      (exercise) =>
        current && setState(exercise ? { status: "ready", exercise } : { status: "missing" }),
      () => current && setState({ status: "error" }),
    );
    return () => {
      current = false;
    };
  }, [slug]);

  return (
    // Backdrop: a click outside the panel, or Escape, closes it.
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`About ${name}`}
        className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border bg-background shadow-xl sm:max-w-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b py-2 pr-2 pl-5">
          <p className="text-sm font-medium text-muted-foreground">Exercise information</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Close"
            onClick={onClose}
            autoFocus
          >
            <X />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 pt-4 pb-6">
          {state.status === "loading" ? (
            <p className="py-10 text-muted-foreground" aria-live="polite">Loading {name}…</p>
          ) : state.status === "ready" ? (
            <ExerciseInfo exercise={state.exercise} as="h2" progressLink={false} />
          ) : (
            <p className="py-10 text-muted-foreground" role="alert">
              {state.status === "missing"
                ? "This exercise was not found."
                : "The information could not be loaded. Try again."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type ExerciseInfoButtonProps = {
  slug: string;
  name: string;
  /** Accessible name of the icon button; defaults to "About <name>". */
  label?: string;
  /** Visible text. With it the control is a text link instead of an icon. */
  text?: string;
  className?: string;
};

/**
 * Opens the exercise information in a modal over the current screen, so
 * whatever the screen holds in memory (an unsaved routine, a running timer)
 * stays.
 */
export function ExerciseInfoButton({ slug, name, label, text, className }: ExerciseInfoButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {text ? (
        <Button
          type="button"
          variant="link"
          className={`h-11 gap-1.5 px-0 ${className ?? ""}`}
          onClick={() => setOpen(true)}
        >
          <Info aria-hidden="true" />
          {text}
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className={className}
          aria-label={label ?? `About ${name}`}
          onClick={() => setOpen(true)}
        >
          <Info className="text-primary" />
        </Button>
      )}
      {open ? <Overlay slug={slug} name={name} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
