"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  abandonSessionAction,
  completeSessionAction,
  completeSetAction,
} from "@/lib/workout/actions";
import {
  buildSetOrder,
  findNextSlot,
  isSlotLogged,
  resolvePositionExercise,
  type SetSlot,
} from "@/lib/workout/set-order";
import type {
  LoggedSet,
  Prefill,
  SessionPosition,
  WeightUnit,
} from "@/lib/workout/types";
import { ExerciseInfoButton } from "@/components/exercises/exercise-info-button";
import { RestTimer } from "@/components/workout/rest-timer";
import { Check, ChevronLeft } from "lucide-react";

type WorkoutSessionClientProps = {
  sessionId: string;
  dayTitle: string;
  positions: SessionPosition[];
  initialSets: LoggedSet[];
  prefills: Record<string, Prefill>;
};

type Draft = {
  slot: string;
  load?: string;
  reps?: string;
  durationSec?: string;
  weightUnit?: WeightUnit;
};

function slotKey(slot: SetSlot) {
  return `${slot.exerciseId}:${slot.setIndex}:${slot.side ?? "none"}`;
}

function slotLabel(slot: SetSlot) {
  if (slot.side === "left") return `Serie ${slot.setIndex} · izq`;
  if (slot.side === "right") return `Serie ${slot.setIndex} · der`;
  return `Serie ${slot.setIndex}`;
}

function repGuide(position: SessionPosition): string | null {
  const { repMin, repMax } = position;
  if (repMin != null && repMax != null) {
    return repMin === repMax ? `${repMin} reps` : `${repMin}–${repMax} reps`;
  }
  if (repMin != null) return `${repMin}+ reps`;
  if (repMax != null) return `hasta ${repMax} reps`;
  return null;
}

export function WorkoutSessionClient({
  sessionId,
  dayTitle,
  positions,
  initialSets,
  prefills,
}: WorkoutSessionClientProps) {
  const router = useRouter();
  const [sets, setSets] = useState(initialSets);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // `run` restarts the timer even when two rests in a row last the same.
  const [rest, setRest] = useState<{ seconds: number; run: number } | null>(null);
  const [draft, setDraft] = useState<Draft>({ slot: "" });

  // Each day entry with the exercise in use: fixed once it has a set,
  // otherwise the user's choice between the exercise and its alternative.
  const resolved = useMemo(
    () =>
      positions.map((position) => {
        const { exerciseId, fixed } = resolvePositionExercise(
          {
            exerciseId: position.exercise.id,
            alternativeExerciseId: position.alternative?.id ?? null,
          },
          sets,
          choices[position.id],
        );
        const usingAlternative = position.alternative?.id === exerciseId;
        return {
          position,
          fixed,
          exercise: usingAlternative ? position.alternative! : position.exercise,
          other: usingAlternative ? position.exercise : position.alternative,
        };
      }),
    [positions, sets, choices],
  );

  const slots = useMemo(
    () =>
      buildSetOrder(
        resolved.map(({ position, exercise }) => ({
          id: position.id,
          exerciseId: exercise.id,
          modality: exercise.modality,
          targetSets: position.targetSets,
          restSeconds: position.restSeconds,
          supersetGroup: position.supersetGroup,
        })),
      ),
    [resolved],
  );

  const nextSlot = useMemo(() => findNextSlot(slots, sets), [slots, sets]);
  const active = resolved.find((r) => r.position.id === nextSlot?.positionId);
  const allDone = nextSlot == null;

  // Inputs start from the last set of this exercise in this session, then
  // from the last completed session; what the user types overrides both.
  const key = nextSlot ? slotKey(nextSlot) : "";
  const typed = draft.slot === key ? draft : { slot: key };
  const lastHere = active
    ? sets.findLast((set) => set.exerciseId === active.exercise.id)
    : undefined;
  const prefill = active ? prefills[active.exercise.id] : undefined;
  const load = typed.load ?? (lastHere?.load ?? prefill?.load)?.toString() ?? "";
  const reps = typed.reps ?? (lastHere?.reps ?? prefill?.reps)?.toString() ?? "";
  const durationSec =
    typed.durationSec ??
    (lastHere?.durationSec ?? prefill?.durationSec)?.toString() ??
    "";
  const weightUnit: WeightUnit =
    typed.weightUnit ?? lastHere?.weightUnit ?? prefill?.weightUnit ?? "kg";
  const edit = (patch: Omit<Draft, "slot">) => setDraft({ ...typed, ...patch });

  const handleTerminado = () => {
    if (!nextSlot || !active) return;
    setError(null);
    const timed = active.exercise.modality === "time";

    if (!timed && (load.trim() === "" || !(Number(reps) > 0))) {
      setError("Indica peso y repeticiones.");
      return;
    }
    if (timed && !(Number(durationSec) > 0)) {
      setError("Indica la duración en segundos.");
      return;
    }

    const payload = {
      exerciseId: nextSlot.exerciseId,
      setIndex: nextSlot.setIndex,
      side: nextSlot.side,
      weightUnit: timed ? undefined : weightUnit,
      load: timed ? undefined : Number(load),
      reps: timed ? undefined : Number(reps),
      durationSec: timed ? Number(durationSec) : undefined,
    };

    startTransition(async () => {
      try {
        const saved = await completeSetAction(sessionId, payload);
        setSets((prev) =>
          prev.some((set) => set.id === saved.id)
            ? prev
            : [
                ...prev,
                {
                  id: saved.id,
                  exerciseId: saved.exerciseId,
                  setIndex: saved.setIndex,
                  side: saved.side,
                  load: saved.load,
                  weightUnit: saved.weightUnit,
                  reps: saved.reps,
                  durationSec: saved.durationSec,
                },
              ],
        );
        // Inside a superset round the next exercise follows without rest.
        const seconds = nextSlot.restAfterSeconds;
        setRest((prev) =>
          seconds == null ? null : { seconds, run: (prev?.run ?? 0) + 1 },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el set.");
      }
    });
  };

  const handleFinish = () => {
    startTransition(async () => {
      await completeSessionAction(sessionId);
      router.push("/entrenar");
      router.refresh();
    });
  };

  const handleLeave = () => {
    if (allDone) {
      router.push("/entrenar");
      return;
    }
    if (
      !window.confirm(
        "¿Descartar este entrenamiento? No se guardará ningún avance.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await abandonSessionAction(sessionId);
      router.push("/entrenar");
      router.refresh();
    });
  };

  const guide = active ? repGuide(active.position) : null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 pb-28 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={handleLeave}>
          <ChevronLeft className="mr-1 size-4" />
          Salir
        </Button>
        <Badge variant="secondary">En curso</Badge>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{dayTitle}</h1>
        <p className="text-sm text-muted-foreground">
          Marca cada serie como terminada; el descanso arranca solo.
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {allDone ? (
        <Card>
          <CardHeader>
            <CardTitle>¡Listo!</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Has registrado todas las series de hoy. Finaliza para guardar el
              entrenamiento en tu historial.
            </p>
            <Button onClick={handleFinish} disabled={pending}>
              Finalizar entrenamiento
            </Button>
          </CardContent>
        </Card>
      ) : active && nextSlot ? (
        <Card className="mb-6">
          <CardHeader>
            {nextSlot.superset ? (
              <Badge variant="secondary" className="mb-1 w-fit">
                Superserie · ronda {nextSlot.superset.round} de{" "}
                {nextSlot.superset.rounds}
              </Badge>
            ) : null}
            <CardTitle className="text-lg">{active.exercise.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {slotLabel(nextSlot)} de {active.position.targetSets}
              {guide ? ` · objetivo ${guide}` : ""}
            </p>
            {active.position.note ? (
              <p className="text-sm text-muted-foreground">{active.position.note}</p>
            ) : null}
            <ExerciseInfoButton
              slug={active.exercise.slug}
              name={active.exercise.name}
              text="Cómo se hace"
              className="w-fit"
            />
            {active.other && !active.fixed ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto w-fit p-0"
                  onClick={() =>
                    setChoices((prev) => ({
                      ...prev,
                      [active.position.id]: active.other!.id,
                    }))
                  }
                >
                  Cambiar a {active.other.name}
                </Button>
                <ExerciseInfoButton
                  slug={active.other.slug}
                  name={active.other.name}
                  label={`Cómo se hace: ${active.other.name}`}
                />
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4">
            {active.exercise.modality !== "time" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="load">Peso</Label>
                    <Input
                      id="load"
                      inputMode="decimal"
                      className="h-12 text-lg"
                      value={load}
                      onChange={(e) => edit({ load: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      inputMode="numeric"
                      className="h-12 text-lg"
                      value={reps}
                      onChange={(e) => edit({ reps: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {(["kg", "lb"] as WeightUnit[]).map((unit) => (
                    <Button
                      key={unit}
                      type="button"
                      size="sm"
                      variant={weightUnit === unit ? "default" : "outline"}
                      onClick={() => edit({ weightUnit: unit })}
                    >
                      {unit}
                    </Button>
                  ))}
                </div>
              </>
            )}
            {active.exercise.modality === "time" && (
              <div className="grid gap-2">
                <Label htmlFor="duration">Segundos</Label>
                <Input
                  id="duration"
                  inputMode="numeric"
                  className="h-12 text-lg"
                  value={durationSec}
                  onChange={(e) => edit({ durationSec: e.target.value })}
                />
              </div>
            )}
            <Button
              className="h-12 text-base"
              onClick={handleTerminado}
              disabled={pending}
            >
              Terminado
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Progreso de hoy
        </h2>
        {resolved.map(({ position, exercise }) => (
          <Card key={position.id}>
            <CardHeader className="py-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  {exercise.name}
                  {position.supersetGroup != null ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      superserie
                    </span>
                  ) : null}
                </CardTitle>
                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <Link href={`/progreso/${exercise.slug}`}>Gráfico</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-1 pb-3 text-sm">
              {slots
                .filter((slot) => slot.positionId === position.id)
                .sort((a, b) => a.setIndex - b.setIndex)
                .map((slot) => {
                  const logged = isSlotLogged(sets, slot)
                    ? sets.find(
                        (s) =>
                          s.exerciseId === slot.exerciseId &&
                          s.setIndex === slot.setIndex &&
                          (s.side ?? undefined) === slot.side,
                      )
                    : undefined;
                  return (
                    <div
                      key={slotKey(slot)}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <span>{slotLabel(slot)}</span>
                      {logged ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Check className="size-4 text-primary" />
                          {logged.durationSec != null
                            ? `${logged.durationSec} s`
                            : `${logged.load ?? "—"} ${logged.weightUnit ?? ""} × ${logged.reps ?? "—"}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pendiente</span>
                      )}
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="mt-6 flex flex-col gap-2">
        {!allDone ? (
          <Button variant="outline" onClick={handleLeave} disabled={pending}>
            Descartar entrenamiento
          </Button>
        ) : null}
      </div>

      {rest != null ? (
        <RestTimer
          key={rest.run}
          restSeconds={rest.seconds}
          onDone={() => setRest(null)}
          onSkip={() => setRest(null)}
        />
      ) : null}
    </div>
  );
}
