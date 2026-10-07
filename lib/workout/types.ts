import type { Modality } from "@/lib/catalog/types";

export type ExerciseModality = Modality;
export type WeightUnit = "kg" | "lb";
export type SessionStatus = "in_progress" | "completed";
export type SetSide = "left" | "right";

export type SessionExerciseRef = {
  id: string;
  slug: string;
  name: string;
  modality: ExerciseModality;
};

/** One entry of a routine day as the live session needs it. */
export type SessionPosition = {
  id: string;
  exercise: SessionExerciseRef;
  alternative: SessionExerciseRef | null;
  targetSets: number;
  restSeconds: number;
  repMin: number | null;
  repMax: number | null;
  note: string | null;
  supersetGroup: number | null;
};

export type LoggedSet = {
  id: string;
  exerciseId: string;
  setIndex: number;
  side: SetSide | null;
  load: number | null;
  weightUnit: WeightUnit | null;
  reps: number | null;
  durationSec: number | null;
};

export type CompletedSetInput = {
  exerciseId: string;
  setIndex: number;
  side?: SetSide;
  load?: number;
  weightUnit?: WeightUnit;
  reps?: number;
  durationSec?: number;
};

export type Prefill = {
  load?: number;
  reps?: number;
  durationSec?: number;
  weightUnit: WeightUnit;
};

export type SideLoad = {
  load: number;
  reps: number | null;
};

export type ProgressPoint = {
  date: string;
  label: string;
  /** Heaviest load, or best duration in seconds. */
  value: number;
  /** kg, lb, or s */
  unit: string;
  reps: number | null;
  durationSec: number | null;
  left: SideLoad | null;
  right: SideLoad | null;
};
