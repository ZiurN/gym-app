import type { ExerciseModality, SetSide } from "./types";

/** A day entry with the exercise the user is doing for it already resolved. */
export type OrderPosition = {
  id: string;
  exerciseId: string;
  modality: ExerciseModality;
  targetSets: number;
  restSeconds: number;
  supersetGroup: number | null;
};

export type SetSlot = {
  positionId: string;
  exerciseId: string;
  setIndex: number;
  side?: SetSide;
  /** Seconds of rest that finishing this slot starts; null inside a superset round. */
  restAfterSeconds: number | null;
  superset: { round: number; rounds: number } | null;
};

type LoggedLike = { exerciseId: string; setIndex: number; side?: SetSide | null };

function slotsForSet(position: OrderPosition, setIndex: number) {
  const base = { positionId: position.id, exerciseId: position.exerciseId, setIndex };
  return position.modality === "per_side"
    ? [
        { ...base, side: "left" as const },
        { ...base, side: "right" as const },
      ]
    : [base];
}

/**
 * Every set of a day in the order it is done. Plain exercises go one after
 * another; a superset goes in rounds across its exercises, skipping those
 * with no sets left, and only the last set of a round starts rest.
 */
export function buildSetOrder(positions: OrderPosition[]): SetSlot[] {
  const slots: SetSlot[] = [];

  for (let i = 0; i < positions.length; ) {
    const group = positions[i].supersetGroup;
    let end = i + 1;
    while (group != null && end < positions.length && positions[end].supersetGroup === group) {
      end += 1;
    }
    const block = positions.slice(i, end);
    i = end;

    if (block.length === 1) {
      const [position] = block;
      for (let set = 1; set <= position.targetSets; set += 1) {
        for (const slot of slotsForSet(position, set)) {
          slots.push({ ...slot, restAfterSeconds: position.restSeconds, superset: null });
        }
      }
      continue;
    }

    const rounds = Math.max(...block.map((position) => position.targetSets));
    for (let round = 1; round <= rounds; round += 1) {
      const roundSlots = block
        .filter((position) => position.targetSets >= round)
        .flatMap((position) => slotsForSet(position, round));
      roundSlots.forEach((slot, index) => {
        slots.push({
          ...slot,
          restAfterSeconds:
            index === roundSlots.length - 1 ? block[0].restSeconds : null,
          superset: { round, rounds },
        });
      });
    }
  }

  return slots;
}

export function isSlotLogged(logged: LoggedLike[], slot: SetSlot): boolean {
  return logged.some(
    (set) =>
      set.exerciseId === slot.exerciseId &&
      set.setIndex === slot.setIndex &&
      (set.side ?? undefined) === slot.side,
  );
}

export function findNextSlot(slots: SetSlot[], logged: LoggedLike[]): SetSlot | null {
  return slots.find((slot) => !isSlotLogged(logged, slot)) ?? null;
}

/**
 * Which exercise a day entry uses in this session: the one already logged,
 * otherwise the user's choice, otherwise the main exercise. The first logged
 * set fixes it for the rest of the session.
 */
export function resolvePositionExercise(
  position: { exerciseId: string; alternativeExerciseId: string | null },
  logged: Pick<LoggedLike, "exerciseId">[],
  choice?: string | null,
): { exerciseId: string; fixed: boolean } {
  const { exerciseId, alternativeExerciseId } = position;
  if (logged.some((set) => set.exerciseId === exerciseId)) {
    return { exerciseId, fixed: true };
  }
  if (alternativeExerciseId != null) {
    if (logged.some((set) => set.exerciseId === alternativeExerciseId)) {
      return { exerciseId: alternativeExerciseId, fixed: true };
    }
    if (choice === alternativeExerciseId) {
      return { exerciseId: alternativeExerciseId, fixed: false };
    }
  }
  return { exerciseId, fixed: false };
}
