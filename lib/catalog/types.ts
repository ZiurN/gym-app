export const MODALITIES = ["load_reps", "time", "per_side"] as const;
export type Modality = (typeof MODALITIES)[number];

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "neck",
  "cardio",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "kettlebell",
  "machine",
  "cable",
  "bodyweight",
  "band",
  "other",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export type CatalogExercise = {
  id: string;
  slug: string;
  name: string;
  modality: Modality;
  primaryMuscle: string;
  equipment: string;
  retired: boolean;
};

/** Everything the exercise information view shows. */
export type ExerciseDetails = CatalogExercise & {
  targetMuscle: string | null;
  secondaryMuscles: string[];
  equipmentDetail: string | null;
  hasPhotos: boolean;
  steps: string[];
};

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  core: "Core",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  neck: "Neck",
  cardio: "Cardio",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  machine: "Machine",
  cable: "Cable",
  bodyweight: "Bodyweight",
  band: "Band",
  other: "Other",
};

export function labelFor(value: string): string {
  return (
    MUSCLE_LABELS[value as MuscleGroup] ??
    EQUIPMENT_LABELS[value as Equipment] ??
    value
  );
}

/** "leverage machine" -> "Leverage machine" */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
