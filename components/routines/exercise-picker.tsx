"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseInfoButton } from "@/components/exercises/exercise-info-button";
import { filterCatalog, limitResults } from "@/lib/catalog/filter";
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  labelFor,
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  type CatalogExercise,
} from "@/lib/catalog/types";

type ExercisePickerProps = {
  title: string;
  subtitle: string;
  /** Exercises on offer; retired ones are already left out. */
  exercises: CatalogExercise[];
  /** Exercise ids already in the day, alternatives included. */
  inDay: ReadonlySet<string>;
  pickLabel: string;
  onPick: (exercise: CatalogExercise) => void;
  onClose: () => void;
};

export function ExercisePicker({
  title,
  subtitle,
  exercises,
  inDay,
  pickLabel,
  onPick,
  onClose,
}: ExercisePickerProps) {
  const [text, setText] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);

  const { shown, total } = useMemo(
    () => limitResults(filterCatalog(exercises, { text, muscle, equipment })),
    [exercises, text, muscle, equipment],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="mx-auto flex w-full max-w-lg items-center gap-2 px-2 pt-4 pb-2 sm:px-4">
        <Button type="button" variant="ghost" size="icon-lg" aria-label="Back to routine" onClick={onClose}>
          <ChevronLeft className="size-5" />
        </Button>
        <div>
          <h2 id="picker-title" className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-lg gap-3 border-b px-4 pb-3 sm:px-6">
        <div className="relative">
          <Label htmlFor="exercise-search" className="sr-only">Search exercises</Label>
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="exercise-search"
            type="search"
            placeholder="Search exercises"
            className="h-11 pl-9"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>
        <div role="group" aria-label="Muscle group" className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={muscle == null ? "default" : "outline"}
            aria-pressed={muscle == null}
            className="rounded-full"
            onClick={() => setMuscle(null)}
          >
            All muscles
          </Button>
          {MUSCLE_GROUPS.map((group) => (
            <Button
              key={group}
              type="button"
              size="sm"
              variant={muscle === group ? "default" : "outline"}
              aria-pressed={muscle === group}
              className="rounded-full"
              onClick={() => setMuscle(muscle === group ? null : group)}
            >
              {MUSCLE_LABELS[group]}
            </Button>
          ))}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="exercise-equipment">Equipment</Label>
          <select
            id="exercise-equipment"
            className="h-11 rounded-md border border-input bg-transparent px-3 text-base"
            value={equipment ?? ""}
            onChange={(e) => setEquipment(e.target.value || null)}
          >
            <option value="">Any equipment</option>
            {EQUIPMENT.map((item) => (
              <option key={item} value={item}>{EQUIPMENT_LABELS[item]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
        <p className="py-3 text-sm text-muted-foreground" aria-live="polite">
          {total === 0
            ? "No exercises match. Try a different search or filter."
            : total > shown.length
              ? `Showing the first ${shown.length} of ${total} exercises. Refine the search or filters to see the rest.`
              : `${total} ${total === 1 ? "exercise" : "exercises"}`}
        </p>
        <ul className="divide-y border-y empty:border-0">
          {shown.map((exercise) => (
            <li key={exercise.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-muted-foreground">
                  {labelFor(exercise.primaryMuscle)} · {labelFor(exercise.equipment)}
                </p>
                <ExerciseInfoButton
                  slug={exercise.slug}
                  name={exercise.name}
                  text="How it's done"
                  className="h-9 text-sm"
                />
              </div>
              {inDay.has(exercise.id) ? (
                <span className="text-sm font-medium text-muted-foreground">
                  Already in this day
                </span>
              ) : (
                <Button
                  type="button"
                  aria-label={`${pickLabel} ${exercise.name}`}
                  onClick={() => onPick(exercise)}
                >
                  {pickLabel}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
