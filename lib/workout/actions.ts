"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  abandonSessionForUser,
  completeSessionForUser,
  completeSetForUser,
  deleteSetForUser,
  startOrResumeSession,
} from "@/lib/workout/session-service";
import type { CompletedSetInput } from "@/lib/workout/types";

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Debes iniciar sesión para registrar entrenamientos.");
  }
  return user.id;
}

// A session opening or closing changes what the training and routines
// screens show (the lock), so both are refreshed.
function revalidateSession(routineDayId?: string | null) {
  revalidatePath("/entrenar");
  if (routineDayId) revalidatePath(`/entrenar/${routineDayId}`);
  revalidatePath("/routines", "layout");
}

export async function startSessionAction(routineDayId: string, force = false) {
  const userId = await requireUserId();
  const result = await startOrResumeSession(userId, routineDayId, force);
  if (result.status === "ready") revalidateSession(routineDayId);
  return result;
}

export async function completeSetAction(
  sessionId: string,
  input: CompletedSetInput,
) {
  const userId = await requireUserId();
  const { set, routineDayId } = await completeSetForUser(userId, sessionId, input);
  revalidatePath(`/entrenar/${routineDayId}`);
  return set;
}

export async function completeSessionAction(sessionId: string) {
  const userId = await requireUserId();
  const { routineDayId } = await completeSessionForUser(userId, sessionId);
  revalidateSession(routineDayId);
  revalidatePath("/progreso");
  return { ok: true };
}

export async function abandonSessionAction(sessionId: string) {
  const userId = await requireUserId();
  const { routineDayId } = await abandonSessionForUser(userId, sessionId);
  revalidateSession(routineDayId);
  return { ok: true };
}

export async function deleteSetAction(sessionId: string, setId: string) {
  const userId = await requireUserId();
  const { routineDayId } = await deleteSetForUser(userId, sessionId, setId);
  if (routineDayId) revalidatePath(`/entrenar/${routineDayId}`);
}
