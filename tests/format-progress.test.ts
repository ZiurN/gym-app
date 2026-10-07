import { describe, expect, it } from "vitest";
import {
  formatDelta,
  formatMeasure,
  formatNumber,
  formatSetDetail,
  progressCaption,
} from "@/lib/workout/format-progress";
import type { ProgressPoint } from "@/lib/workout/types";

const point = (overrides: Partial<ProgressPoint>): ProgressPoint => ({
  date: "2026-10-02T00:00:00.000Z",
  label: "Oct 2",
  value: 62.5,
  unit: "kg",
  reps: 8,
  durationSec: null,
  left: null,
  right: null,
  ...overrides,
});

describe("progress formatting", () => {
  it("writes decimals with a point", () => {
    expect(formatNumber(62.5)).toBe("62.5");
    expect(formatNumber(1250)).toBe("1,250");
    expect(formatMeasure(62.5, "kg")).toBe("62.5 kg");
  });

  it("signs a change", () => {
    expect(formatDelta(2.5, "kg")).toBe("+2.5 kg");
    expect(formatDelta(-2.5, "kg")).toBe("−2.5 kg");
    expect(formatDelta(0, "kg")).toBe("0 kg");
  });

  it("describes sets in English", () => {
    expect(formatSetDetail(point({}))).toBe("62.5 × 8");
    expect(
      formatSetDetail(point({ left: { load: 12.5, reps: 12 }, right: { load: 15, reps: 10 } })),
    ).toBe("L 12.5 × 12 · R 15 × 10");
    expect(progressCaption(point({}))).toBe("heaviest set of the last workout");
    expect(progressCaption(point({ durationSec: 45 }))).toBe("longest set");
  });
});
