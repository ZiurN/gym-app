import { describe, expect, it } from "vitest";
import { suggestNextDayId } from "@/lib/workout/next-day";
import {
  buildSetOrder,
  findNextSlot,
  resolvePositionExercise,
  type OrderPosition,
} from "@/lib/workout/set-order";

const position = (
  id: string,
  targetSets: number,
  overrides: Partial<OrderPosition> = {},
): OrderPosition => ({
  id,
  exerciseId: id,
  modality: "load_reps",
  targetSets,
  restSeconds: 90,
  supersetGroup: null,
  ...overrides,
});
const label = (slot: { exerciseId: string; setIndex: number; side?: string }) =>
  `${slot.exerciseId}${slot.setIndex}${slot.side ? slot.side[0] : ""}`;
const order = (positions: OrderPosition[]) => buildSetOrder(positions).map(label);

describe("buildSetOrder", () => {
  it("runs plain exercises one after another, each set starting rest", () => {
    const slots = buildSetOrder([position("A", 2), position("B", 1, { restSeconds: 60 })]);
    expect(slots.map(label)).toEqual(["A1", "A2", "B1"]);
    expect(slots.map((s) => s.restAfterSeconds)).toEqual([90, 90, 60]);
    expect(slots.every((s) => s.superset === null)).toBe(true);
  });

  it("gives per-side exercises a left and a right slot per set", () => {
    expect(order([position("A", 2, { modality: "per_side" })])).toEqual([
      "A1l", "A1r", "A2l", "A2r",
    ]);
  });

  it("alternates a superset with equal sets and rests only after each round", () => {
    const slots = buildSetOrder([
      position("A", 3, { supersetGroup: 1, restSeconds: 60 }),
      position("B", 3, { supersetGroup: 1, restSeconds: 60 }),
    ]);
    expect(slots.map(label)).toEqual(["A1", "B1", "A2", "B2", "A3", "B3"]);
    expect(slots.map((s) => s.restAfterSeconds)).toEqual([null, 60, null, 60, null, 60]);
    expect(slots[2].superset).toEqual({ round: 2, rounds: 3 });
  });

  it("skips an exercise with no sets left in later rounds", () => {
    const slots = buildSetOrder([
      position("A", 3, { supersetGroup: 1, restSeconds: 45 }),
      position("B", 2, { supersetGroup: 1, restSeconds: 45 }),
    ]);
    expect(slots.map(label)).toEqual(["A1", "B1", "A2", "B2", "A3"]);
    // In the last round A is alone, so its set ends the round.
    expect(slots.at(-1)?.restAfterSeconds).toBe(45);
  });

  it("keeps supersets apart from their neighbours and from each other", () => {
    expect(
      order([
        position("P", 1),
        position("A", 2, { supersetGroup: 1 }),
        position("B", 2, { supersetGroup: 1 }),
        position("C", 1, { supersetGroup: 2 }),
        position("D", 1, { supersetGroup: 2 }),
        position("Q", 1),
      ]),
    ).toEqual(["P1", "A1", "B1", "A2", "B2", "C1", "D1", "Q1"]);
  });

  it("returns nothing for an empty day", () => {
    expect(buildSetOrder([])).toEqual([]);
  });
});

describe("findNextSlot", () => {
  const slots = buildSetOrder([
    position("A", 2, { supersetGroup: 1 }),
    position("B", 2, { supersetGroup: 1 }),
    position("C", 1, { modality: "per_side" }),
  ]);

  it("continues a partly logged session at the first missing slot", () => {
    const logged = [
      { exerciseId: "A", setIndex: 1 },
      { exerciseId: "B", setIndex: 1, side: null },
      { exerciseId: "A", setIndex: 2 },
    ];
    expect(label(findNextSlot(slots, logged)!)).toBe("B2");
  });

  it("tells sides apart", () => {
    const logged = [
      ...["A", "B"].flatMap((id) => [1, 2].map((setIndex) => ({ exerciseId: id, setIndex }))),
      { exerciseId: "C", setIndex: 1, side: "left" as const },
    ];
    expect(label(findNextSlot(slots, logged)!)).toBe("C1r");
  });

  it("returns null when everything is logged", () => {
    const logged = slots.map((s) => ({ ...s, side: s.side ?? null }));
    expect(findNextSlot(slots, logged)).toBeNull();
  });
});

describe("resolvePositionExercise", () => {
  const pos = { exerciseId: "pull-up", alternativeExerciseId: "pulldown" };

  it("shows the main exercise by default", () => {
    expect(resolvePositionExercise(pos, [])).toEqual({ exerciseId: "pull-up", fixed: false });
  });

  it("follows the user's choice before the first set", () => {
    expect(resolvePositionExercise(pos, [], "pulldown")).toEqual({
      exerciseId: "pulldown", fixed: false,
    });
  });

  it("is fixed by the first logged set, whatever is chosen afterwards", () => {
    expect(
      resolvePositionExercise(pos, [{ exerciseId: "pulldown" }], "pull-up"),
    ).toEqual({ exerciseId: "pulldown", fixed: true });
    expect(
      resolvePositionExercise(pos, [{ exerciseId: "pull-up" }], "pulldown"),
    ).toEqual({ exerciseId: "pull-up", fixed: true });
  });

  it("ignores a choice that is not the alternative", () => {
    expect(
      resolvePositionExercise({ exerciseId: "a", alternativeExerciseId: null }, [], "zzz"),
    ).toEqual({ exerciseId: "a", fixed: false });
  });
});

describe("suggestNextDayId", () => {
  const days = ["d1", "d2", "d3", "d4"];

  it("suggests the day after the last completed one", () => {
    expect(suggestNextDayId(days, "d2")).toBe("d3");
  });

  it("wraps to the first day after the last", () => {
    expect(suggestNextDayId(days, "d4")).toBe("d1");
  });

  it("suggests the first day when nothing from this routine was completed", () => {
    expect(suggestNextDayId(days, null)).toBe("d1");
    expect(suggestNextDayId(days, "day-of-another-routine")).toBe("d1");
  });

  it("has nothing to suggest without days", () => {
    expect(suggestNextDayId([], null)).toBeNull();
  });
});
