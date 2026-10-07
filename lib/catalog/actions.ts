"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { getExerciseDetails } from "./queries";
import type { ExerciseDetails } from "./types";

/** One exercise's details for the in-place overlay; null when it does not exist. */
export async function getExerciseDetailsAction(
  slug: string,
): Promise<ExerciseDetails | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in to see exercise information.");
  return getExerciseDetails(slug);
}
