import { describe, expect, it } from "vitest";
import {
  isValidWeight,
  isValidWholeNumber,
  parseWeight,
  parseWholeNumber,
  weightForInput,
} from "@/lib/workout/figures";

describe("parseWeight", () => {
  it.each([
    ["12,5", 12.5],
    ["12.5", 12.5],
    ["12", 12],
    ["0", 0],
    [" 22,5 ", 22.5],
    ["12,", 12],
  ])("reads %j as %d", (text, value) => {
    expect(parseWeight(text)).toEqual({ ok: true, value });
  });

  it.each([
    ["12,55", /one decimal/],
    ["12.555", /one decimal/],
    ["-5", /number/],
    ["abc", /number/],
    ["12,5,5", /number/],
    ["1e3", /number/],
    ["", /Enter the weight/],
    ["   ", /Enter the weight/],
  ])("refuses %j", (text, message) => {
    const parsed = parseWeight(text);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.message).toMatch(message);
  });
});

describe("parseWholeNumber", () => {
  it("reads whole numbers above 0", () => {
    expect(parseWholeNumber("8", "reps")).toEqual({ ok: true, value: 8 });
    expect(parseWholeNumber(" 45 ", "seconds")).toEqual({ ok: true, value: 45 });
  });

  it.each(["0", "8.5", "8,5", "-3", "", "ten"])("refuses %j", (text) => {
    const parsed = parseWholeNumber(text, "reps");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.message).toBe("Enter the reps as a whole number above 0.");
  });
});

describe("server-side checks", () => {
  it("accept only finite weights of 0 or more with at most one decimal", () => {
    for (const ok of [0, 12, 12.5, 62.5, 1000.1]) expect(isValidWeight(ok), String(ok)).toBe(true);
    for (const bad of [Number.NaN, Infinity, -1, 12.55, null, undefined, "12"]) {
      expect(isValidWeight(bad), String(bad)).toBe(false);
    }
  });

  it("accept only whole numbers above 0", () => {
    expect(isValidWholeNumber(8)).toBe(true);
    for (const bad of [0, -1, 8.5, Number.NaN, null, undefined, "8"]) {
      expect(isValidWholeNumber(bad), String(bad)).toBe(false);
    }
  });
});

describe("weightForInput", () => {
  it("hides the single-precision noise of stored weights", () => {
    expect(weightForInput(Math.fround(12.3))).toBe("12.3");
    expect(weightForInput(60)).toBe("60");
  });
});
