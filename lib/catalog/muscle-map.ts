/** Regions of the schematic body drawing in components/exercises/muscle-map.tsx. */
export const MUSCLE_REGIONS = [
  "neck",
  "traps",
  "shoulders",
  "rear-shoulders",
  "chest",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "obliques",
  "upper-back",
  "lats",
  "lower-back",
  "hip-flexors",
  "glutes",
  "abductors",
  "adductors",
  "quads",
  "hamstrings",
  "calves",
] as const;
export type MuscleRegion = (typeof MUSCLE_REGIONS)[number];

/**
 * The catalog's muscle names -> regions. A name mapped to nothing (ankles,
 * hands) or missing from the table is still listed in text.
 */
const NAME_TO_REGIONS: Record<string, MuscleRegion[]> = {
  // targets
  pectorals: ["chest"],
  "serratus anterior": ["chest"],
  lats: ["lats"],
  "upper back": ["upper-back"],
  spine: ["lower-back"],
  delts: ["shoulders", "rear-shoulders"],
  traps: ["traps"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearms"],
  quads: ["quads"],
  hamstrings: ["hamstrings"],
  glutes: ["glutes"],
  adductors: ["adductors"],
  abductors: ["abductors"],
  calves: ["calves"],
  abs: ["abs"],
  "levator scapulae": ["neck"],
  "cardiovascular system": [],
  // secondary muscles
  shoulders: ["shoulders", "rear-shoulders"],
  deltoids: ["shoulders", "rear-shoulders"],
  "rear deltoids": ["rear-shoulders"],
  "rotator cuff": ["rear-shoulders"],
  quadriceps: ["quads"],
  core: ["abs", "obliques"],
  abdominals: ["abs"],
  "lower abs": ["abs"],
  obliques: ["obliques"],
  chest: ["chest"],
  "upper chest": ["chest"],
  "hip flexors": ["hip-flexors"],
  "lower back": ["lower-back"],
  rhomboids: ["upper-back"],
  trapezius: ["traps"],
  back: ["upper-back", "lats"],
  "latissimus dorsi": ["lats"],
  brachialis: ["biceps"],
  soleus: ["calves"],
  wrists: ["forearms"],
  "wrist flexors": ["forearms"],
  "wrist extensors": ["forearms"],
  "grip muscles": ["forearms"],
  sternocleidomastoid: ["neck"],
  groin: ["adductors"],
  "inner thighs": ["adductors"],
  ankles: [],
  "ankle stabilizers": [],
  feet: [],
  hands: [],
  shins: [],
};

export function regionsOfMuscle(name: string): MuscleRegion[] | undefined {
  return NAME_TO_REGIONS[name];
}

/**
 * What the map highlights for an exercise. A region worked as the target is
 * not repeated as secondary. `unplaced` are the muscles the drawing cannot
 * show; they are named in text only.
 */
export function muscleRegionsOf(exercise: {
  targetMuscle: string | null;
  secondaryMuscles: string[];
}): { target: MuscleRegion[]; secondary: MuscleRegion[]; unplaced: string[] } {
  const target = exercise.targetMuscle
    ? (NAME_TO_REGIONS[exercise.targetMuscle] ?? [])
    : [];
  const secondary = new Set<MuscleRegion>();
  const unplaced: string[] = [];

  for (const name of exercise.secondaryMuscles) {
    const regions = NAME_TO_REGIONS[name];
    if (!regions || regions.length === 0) {
      unplaced.push(name);
      continue;
    }
    for (const region of regions) {
      if (!target.includes(region)) secondary.add(region);
    }
  }
  return { target, secondary: [...secondary], unplaced };
}
