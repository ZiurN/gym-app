import { weightForInput } from "@/lib/workout/figures";
import type { LoggedSet } from "@/lib/workout/types";

/** What was done in a set: "62.5 kg × 6" or "45 s". */
export function loggedSetFigures(
  set: Pick<LoggedSet, "load" | "weightUnit" | "reps" | "durationSec">,
): string {
  if (set.durationSec != null) return `${set.durationSec} s`;
  const load = set.load == null ? "—" : weightForInput(set.load);
  return `${load} ${set.weightUnit ?? ""} × ${set.reps ?? "—"}`;
}
