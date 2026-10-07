"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  activateRoutine,
  createRoutine,
  deactivateRoutine,
  deleteRoutine,
  saveRoutine,
} from "./service";
import type { RoutineResult } from "./types";

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in to manage routines.");
  return user.id;
}

function revalidateRoutines() {
  revalidatePath("/routines", "layout");
  revalidatePath("/train");
}

export async function createRoutineAction(
  input: unknown,
): Promise<RoutineResult<{ id: string }>> {
  const result = await createRoutine(await requireUserId(), input);
  if (result.ok) revalidateRoutines();
  return result;
}

export async function saveRoutineAction(
  routineId: string,
  input: unknown,
): Promise<RoutineResult> {
  const result = await saveRoutine(await requireUserId(), routineId, input);
  if (result.ok) revalidateRoutines();
  return result;
}

export async function deleteRoutineAction(routineId: string): Promise<RoutineResult> {
  const result = await deleteRoutine(await requireUserId(), routineId);
  if (result.ok) revalidateRoutines();
  return result;
}

export async function activateRoutineAction(routineId: string): Promise<RoutineResult> {
  const result = await activateRoutine(await requireUserId(), routineId);
  if (result.ok) revalidateRoutines();
  return result;
}

export async function deactivateRoutineAction(routineId: string): Promise<RoutineResult> {
  const result = await deactivateRoutine(await requireUserId(), routineId);
  if (result.ok) revalidateRoutines();
  return result;
}
