"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Lock,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseInfoButton } from "@/components/exercises/exercise-info-button";
import { ExercisePicker } from "@/components/routines/exercise-picker";
import { pickerExercises } from "@/lib/catalog/filter";
import { labelFor, type CatalogExercise } from "@/lib/catalog/types";
import { createRoutineAction, saveRoutineAction } from "@/lib/routines/actions";
import {
  addDay,
  addExercise,
  blocksOf,
  canGroupWithNext,
  describeTargets,
  exerciseIdsInDay,
  groupWithNext,
  moveBlock,
  moveDay,
  removeDay,
  removeExercise,
  removeGroup,
  setGroupRest,
  ungroup,
  updateDay,
  updateExercise,
} from "@/lib/routines/draft";
import type {
  RoutineDayInput,
  RoutineExerciseInput,
  RoutineInput,
  RoutineIssue,
} from "@/lib/routines/types";
import {
  parseRoutineInput,
  ROUTINE_LIMITS,
  validateRoutine,
} from "@/lib/routines/validation";

type RoutineBuilderProps = {
  /** Set when editing a stored routine; absent for a new one or a copy. */
  routineId?: string;
  heading: string;
  initial: RoutineInput;
  catalog: CatalogExercise[];
  /** Superset numbers per day that are stored and therefore fixed. */
  savedSupersets: Record<string, number[]>;
};

type Picker = { kind: "add" } | { kind: "alternative"; rowId: string };

function NumberField({
  id,
  label,
  value,
  onChange,
  optional = false,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  optional?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        className="h-11 text-center text-base"
        value={value == null || Number.isNaN(value) ? "" : value}
        onChange={(e) =>
          onChange(
            e.target.value === "" ? (optional ? null : Number.NaN) : Number(e.target.value),
          )
        }
      />
    </div>
  );
}

export function RoutineBuilder({
  routineId,
  heading,
  initial,
  catalog,
  savedSupersets,
}: RoutineBuilderProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [dayId, setDayId] = useState(initial.days[0]?.id ?? "");
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [issues, setIssues] = useState<RoutineIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);
  const offered = useMemo(() => pickerExercises(catalog), [catalog]);
  const nameOf = (id: string | null) => (id ? (byId.get(id)?.name ?? "Unknown exercise") : "");

  const day = draft.days.find((d) => d.id === dayId) ?? draft.days[0];
  const dayIndex = draft.days.indexOf(day);
  const savedGroups = savedSupersets[day.id] ?? [];
  const changeDay = (change: (d: RoutineDayInput) => RoutineDayInput) =>
    setDraft((current) => updateDay(current, day.id, change));
  const patchRow = (rowId: string, patch: Partial<RoutineExerciseInput>) =>
    changeDay((d) => updateExercise(d, rowId, patch));

  const handleSave = () => {
    setError(null);
    const parsed = parseRoutineInput(draft);
    const found = parsed
      ? validateRoutine(parsed, byId)
      : [{ code: "bad_shape", message: "Fill in the empty number fields." }];
    setIssues(found);
    if (found.length > 0 || !parsed) return;

    startTransition(async () => {
      const result = routineId
        ? await saveRoutineAction(routineId, parsed)
        : await createRoutineAction(parsed);
      if (result.ok) {
        router.push("/routines");
        router.refresh();
        return;
      }
      setIssues(result.issues ?? []);
      setError(result.issues?.length ? null : result.message);
      if (result.code === "locked") router.refresh();
    });
  };

  const issueLabel = (issue: RoutineIssue) => {
    const d = issue.dayIndex == null ? undefined : draft.days[issue.dayIndex];
    const e = issue.exerciseIndex == null ? undefined : d?.exercises[issue.exerciseIndex];
    const where = [d?.name, e ? nameOf(e.exerciseId) : null].filter(Boolean).join(" · ");
    return where ? `${where}: ${issue.message}` : issue.message;
  };

  const pickerRow =
    picker?.kind === "alternative"
      ? day.exercises.find((e) => e.id === picker.rowId)
      : undefined;
  const pickerModality = pickerRow ? byId.get(pickerRow.exerciseId)?.modality : undefined;

  const renderExercise = (exercise: RoutineExerciseInput, inSuperset: boolean, locked: boolean) => {
    const info = byId.get(exercise.exerciseId);
    const alternative = exercise.alternativeExerciseId
      ? byId.get(exercise.alternativeExerciseId)
      : undefined;
    const open = openRowId === exercise.id;
    const fieldId = (name: string) => `${name}-${exercise.id}`;
    return (
      <div
        key={exercise.id}
        className={`rounded-lg border bg-background ${open ? "border-foreground" : ""}`}
      >
        <div className="flex items-center gap-1 py-2 pr-1 pl-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{nameOf(exercise.exerciseId)}</p>
            <p className="truncate text-sm text-muted-foreground">
              {describeTargets(exercise, inSuperset)}
              {exercise.alternativeExerciseId
                ? ` · or ${nameOf(exercise.alternativeExerciseId)}`
                : ""}
            </p>
          </div>
          {info ? <ExerciseInfoButton slug={info.slug} name={info.name} /> : null}
          {!inSuperset ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label={`Move ${nameOf(exercise.exerciseId)} up`}
                onClick={() => changeDay((d) => moveBlock(d, exercise.id, -1))}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label={`Move ${nameOf(exercise.exerciseId)} down`}
                onClick={() => changeDay((d) => moveBlock(d, exercise.id, 1))}
              >
                <ArrowDown />
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-expanded={open}
            aria-label={`${open ? "Close" : "Edit"} ${nameOf(exercise.exerciseId)}`}
            onClick={() => setOpenRowId(open ? null : exercise.id)}
          >
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>

        {open ? (
          <div className="grid gap-4 border-t p-3">
            {info ? (
              <div className="flex flex-wrap items-center justify-between gap-x-3">
                <p className="text-sm text-muted-foreground">
                  {labelFor(info.primaryMuscle)} · {labelFor(info.equipment)}
                </p>
                <ExerciseInfoButton slug={info.slug} name={info.name} text="How it's done" />
              </div>
            ) : null}
            <div className={`grid gap-2 ${inSuperset ? "grid-cols-3" : "grid-cols-4"}`}>
              <NumberField
                id={fieldId("sets")}
                label="Sets"
                value={exercise.targetSets}
                onChange={(v) => patchRow(exercise.id, { targetSets: v ?? Number.NaN })}
              />
              <NumberField
                id={fieldId("rep-min")}
                label="Reps from"
                optional
                value={exercise.repMin}
                onChange={(v) => patchRow(exercise.id, { repMin: v })}
              />
              <NumberField
                id={fieldId("rep-max")}
                label="Reps to"
                optional
                value={exercise.repMax}
                onChange={(v) => patchRow(exercise.id, { repMax: v })}
              />
              {!inSuperset ? (
                <NumberField
                  id={fieldId("rest")}
                  label="Rest, s"
                  value={exercise.restSeconds}
                  onChange={(v) => patchRow(exercise.id, { restSeconds: v ?? Number.NaN })}
                />
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <p className="text-xs font-medium">Alternative exercise</p>
              {exercise.alternativeExerciseId ? (
                <div className="flex items-center justify-between gap-2 rounded-md border py-1 pr-1 pl-3">
                  <span className="flex-1 font-medium">{nameOf(exercise.alternativeExerciseId)}</span>
                  {alternative ? (
                    <ExerciseInfoButton slug={alternative.slug} name={alternative.name} />
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label={`Remove alternative ${nameOf(exercise.alternativeExerciseId)}`}
                    onClick={() => patchRow(exercise.id, { alternativeExerciseId: null })}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 justify-start"
                  onClick={() => setPicker({ kind: "alternative", rowId: exercise.id })}
                >
                  <Plus aria-hidden="true" />
                  Add an alternative
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                You choose which one to do when you train.
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={fieldId("note")} className="text-xs">Note (optional)</Label>
              <Input
                id={fieldId("note")}
                className="h-11"
                maxLength={ROUTINE_LIMITS.noteMax}
                value={exercise.note ?? ""}
                onChange={(e) => patchRow(exercise.id, { note: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {!inSuperset && canGroupWithNext(day, exercise.id) ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => changeDay((d) => groupWithNext(d, exercise.id))}
                >
                  Superset with next exercise
                </Button>
              ) : null}
              {!locked ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => changeDay((d) => removeExercise(d, exercise.id))}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-16 sm:px-6">
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-2 border-b bg-background/95 px-2 py-3 backdrop-blur sm:-mx-6 sm:px-4">
        <Button asChild variant="ghost" size="icon-lg" aria-label="Back to routines">
          <Link href="/routines">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-lg font-bold">{heading}</h1>
        <Button type="button" className="h-11 px-5" disabled={pending} onClick={handleSave}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>

      {error || issues.length > 0 ? (
        <div role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error ? <p>{error}</p> : null}
          {issues.length > 0 ? (
            <ul className="grid gap-1">
              {issues.map((issue, index) => (
                <li key={index}>{issueLabel(issue)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="routine-name">Routine name</Label>
          <Input
            id="routine-name"
            className="h-11 text-base font-medium"
            maxLength={ROUTINE_LIMITS.nameMax}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p id="days-label" className="text-sm font-medium">Training days</p>
            <p className="text-sm text-muted-foreground">
              From {ROUTINE_LIMITS.daysMin} to {ROUTINE_LIMITS.daysMax}
            </p>
          </div>
          <div role="group" aria-labelledby="days-label" className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-11"
              aria-label="Remove the last day"
              disabled={draft.days.length <= ROUTINE_LIMITS.daysMin}
              onClick={() => {
                const last = draft.days[draft.days.length - 1];
                if (
                  last.exercises.length > 0 &&
                  !window.confirm(`Remove "${last.name}" and its exercises?`)
                ) {
                  return;
                }
                if (last.id === day.id) setDayId(draft.days[draft.days.length - 2].id);
                setDraft(removeDay(draft, last.id));
              }}
            >
              <Minus />
            </Button>
            <span className="w-10 text-center text-xl font-bold tabular-nums" aria-live="polite">
              {draft.days.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-11"
              aria-label="Add a day"
              disabled={draft.days.length >= ROUTINE_LIMITS.daysMax}
              onClick={() => setDraft(addDay(draft, () => crypto.randomUUID()))}
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div role="tablist" aria-label="Days" className="flex flex-wrap gap-1.5">
          {draft.days.map((d) => (
            <Button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={d.id === day.id}
              variant={d.id === day.id ? "default" : "outline"}
              className="h-11 max-w-full"
              onClick={() => {
                setDayId(d.id);
                setOpenRowId(null);
              }}
            >
              <span className="truncate">{d.name || "Unnamed day"}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-end gap-1">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="day-name">Day name</Label>
            <Input
              id="day-name"
              className="h-11 text-base"
              maxLength={ROUTINE_LIMITS.nameMax}
              value={day.name}
              onChange={(e) => changeDay((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="size-11"
            aria-label={`Move ${day.name} earlier`}
            disabled={dayIndex === 0}
            onClick={() => setDraft(moveDay(draft, day.id, -1))}
          >
            <ArrowLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="size-11"
            aria-label={`Move ${day.name} later`}
            disabled={dayIndex === draft.days.length - 1}
            onClick={() => setDraft(moveDay(draft, day.id, 1))}
          >
            <ArrowRight />
          </Button>
        </div>

        <div className="grid gap-2.5">
          {day.exercises.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No exercises in this day yet.
            </p>
          ) : null}

          {blocksOf(day).map((block) => {
            const group = block.group;
            if (group == null) return renderExercise(block.exercises[0], false, false);

            const saved = savedGroups.includes(group);
            const first = block.exercises[0];
            return (
              <section
                key={`superset-${group}`}
                aria-label="Superset"
                className="grid gap-2.5 rounded-lg border bg-muted p-2.5"
              >
                <div className="flex items-center gap-1">
                  <p className="flex flex-1 items-center gap-1.5 text-sm font-bold">
                    {saved ? <Lock className="size-4" aria-hidden="true" /> : null}
                    Superset
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Move superset up"
                    onClick={() => changeDay((d) => moveBlock(d, first.id, -1))}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Move superset down"
                    onClick={() => changeDay((d) => moveBlock(d, first.id, 1))}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`superset-rest-${day.id}-${group}`} className="flex-1 text-sm">
                    Rest after each round, s
                  </Label>
                  <Input
                    id={`superset-rest-${day.id}-${group}`}
                    type="number"
                    inputMode="numeric"
                    className="h-11 w-24 bg-background text-center text-base"
                    value={Number.isNaN(first.restSeconds) ? "" : first.restSeconds}
                    onChange={(e) =>
                      changeDay((d) =>
                        setGroupRest(
                          d,
                          group,
                          e.target.value === "" ? Number.NaN : Number(e.target.value),
                        ),
                      )
                    }
                  />
                </div>

                {block.exercises.map((exercise) => renderExercise(exercise, true, saved))}

                {saved ? (
                  <p className="text-xs text-muted-foreground">
                    This grouping is saved and can&apos;t be changed. Duplicate
                    the routine to regroup.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {!saved && canGroupWithNext(day, first.id) ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-background"
                      onClick={() => changeDay((d) => groupWithNext(d, first.id))}
                    >
                      Add next exercise
                    </Button>
                  ) : null}
                  {!saved ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-background"
                      onClick={() => changeDay((d) => ungroup(d, group))}
                    >
                      Ungroup
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm("Remove this superset and its exercises from the day?")) {
                        changeDay((d) => removeGroup(d, group));
                      }
                    }}
                  >
                    Remove superset
                  </Button>
                </div>
              </section>
            );
          })}
        </div>

        <Button
          type="button"
          className="h-12 text-base"
          disabled={day.exercises.length >= ROUTINE_LIMITS.exercisesPerDayMax}
          onClick={() => setPicker({ kind: "add" })}
        >
          <Plus aria-hidden="true" />
          Add exercise
        </Button>

        {draft.days.length > ROUTINE_LIMITS.daysMin ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (
                day.exercises.length > 0 &&
                !window.confirm(`Remove "${day.name}" and its exercises?`)
              ) {
                return;
              }
              const remaining = draft.days.filter((d) => d.id !== day.id);
              setDayId(remaining[Math.min(dayIndex, remaining.length - 1)].id);
              setDraft(removeDay(draft, day.id));
            }}
          >
            Remove this day
          </Button>
        ) : null}
      </div>

      {picker?.kind === "add" ? (
        <ExercisePicker
          title="Add exercise"
          subtitle={`To ${day.name || "this day"}`}
          exercises={offered}
          inDay={exerciseIdsInDay(day)}
          pickLabel="Add"
          onPick={(exercise) => {
            changeDay((d) => addExercise(d, exercise.id, () => crypto.randomUUID()));
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
      {picker?.kind === "alternative" && pickerRow ? (
        <ExercisePicker
          title="Alternative exercise"
          subtitle={`For ${nameOf(pickerRow.exerciseId)}`}
          // The alternative uses the position's targets, so it must be logged the same way.
          exercises={offered.filter((e) => e.modality === pickerModality)}
          inDay={exerciseIdsInDay(day)}
          pickLabel="Choose"
          onPick={(exercise) => {
            patchRow(pickerRow.id, { alternativeExerciseId: exercise.id });
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </div>
  );
}
