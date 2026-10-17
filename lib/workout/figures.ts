/**
 * Reading the figures typed for a set. Shared by the session form and the
 * server, so both accept exactly the same values.
 */

export type Parsed = { ok: true; value: number } | { ok: false; message: string };

const WEIGHT = /^\d+(?:[.,]\d?)?$/;
const TOO_PRECISE = /^\d+[.,]\d{2,}$/;
const WHOLE = /^\d+$/;

/** True for 0 or more with at most one decimal. */
export function isValidWeight(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    Math.abs(value * 10 - Math.round(value * 10)) < 1e-9
  );
}

export function isValidWholeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/** "12,5" and "12.5" are both 12.5; phones in some regions only offer a comma. */
export function parseWeight(text: string): Parsed {
  const typed = text.trim();
  if (typed === "") return { ok: false, message: "Enter the weight." };
  if (TOO_PRECISE.test(typed)) {
    return { ok: false, message: "Use at most one decimal for the weight." };
  }
  if (!WEIGHT.test(typed)) {
    return { ok: false, message: "Enter the weight as a number, for example 12,5." };
  }
  return { ok: true, value: Number(typed.replace(",", ".")) };
}

export function parseWholeNumber(text: string, what: "reps" | "seconds"): Parsed {
  const typed = text.trim();
  if (WHOLE.test(typed) && Number(typed) > 0) return { ok: true, value: Number(typed) };
  return { ok: false, message: `Enter the ${what} as a whole number above 0.` };
}

/**
 * A stored weight as it should appear in an input. The column is single
 * precision, so 12.3 comes back as 12.300000190734863.
 */
export function weightForInput(value: number): string {
  return String(Math.round(value * 10) / 10);
}
