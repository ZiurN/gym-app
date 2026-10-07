import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", async () => (await import("./helpers/db")).dbModuleMock);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: async () => null }));

import * as catalogActions from "@/lib/catalog/actions";
import * as routineActions from "@/lib/routines/actions";
import * as workoutActions from "@/lib/workout/actions";

describe("server actions without a signed-in user", () => {
  it.each([
    ["createRoutineAction", () => routineActions.createRoutineAction({})],
    ["saveRoutineAction", () => routineActions.saveRoutineAction("id", {})],
    ["deleteRoutineAction", () => routineActions.deleteRoutineAction("id")],
    ["activateRoutineAction", () => routineActions.activateRoutineAction("id")],
    ["deactivateRoutineAction", () => routineActions.deactivateRoutineAction("id")],
    ["startSessionAction", () => workoutActions.startSessionAction("id")],
    ["completeSetAction", () => workoutActions.completeSetAction("id", { exerciseId: "x", setIndex: 1 })],
    ["completeSessionAction", () => workoutActions.completeSessionAction("id")],
    ["abandonSessionAction", () => workoutActions.abandonSessionAction("id")],
    ["getExerciseDetailsAction", () => catalogActions.getExerciseDetailsAction("barbell-curl")],
  ])("%s is rejected before touching the database", async (_name, call) => {
    // The database mock throws if it is reached, since no test database exists here.
    await expect(call()).rejects.toThrow(/sign in/i);
  });
});
