/** One exercise in a day. Array order is the order in the day. */
export type RoutineExerciseInput = {
  id: string;
  exerciseId: string;
  targetSets: number;
  restSeconds: number;
  repMin: number | null;
  repMax: number | null;
  note: string | null;
  /** Same number on adjacent exercises of a day = one superset. */
  supersetGroup: number | null;
  alternativeExerciseId: string | null;
};

export type RoutineDayInput = {
  id: string;
  name: string;
  exercises: RoutineExerciseInput[];
};

/** A routine as the builder edits and submits it. */
export type RoutineInput = {
  name: string;
  days: RoutineDayInput[];
};

export type Routine = RoutineInput & {
  id: string;
  isActive: boolean;
};

export type RoutineSummary = {
  id: string;
  name: string;
  isActive: boolean;
  dayCount: number;
  exerciseCount: number;
  emptyDayNames: string[];
};

export type RoutineIssue = {
  code: string;
  message: string;
  dayIndex?: number;
  exerciseIndex?: number;
};

export type RoutineErrorCode =
  | "invalid"
  | "locked"
  | "not_found"
  | "limit"
  | "empty_days";

export type RoutineResult<T = object> =
  | ({ ok: true } & T)
  | {
      ok: false;
      code: RoutineErrorCode;
      message: string;
      issues?: RoutineIssue[];
    };
