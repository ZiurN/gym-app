// The maintenance scripts are plain .mjs so `node` can run them without a build.
type SeedExercise = {
  slug: string;
  name: string;
  modality: string;
  primaryMuscle: string;
  equipment: string;
  sourceId?: string;
  targetMuscle?: string;
  secondaryMuscles?: string[];
  equipmentDetail?: string;
};

declare module "@/scripts/lib/seed-catalog.mjs" {
  type Exec = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
  export function seedCatalog(
    exec: Exec,
    exercises: readonly SeedExercise[],
    newId: () => string,
    options?: {
      instructions?: Record<string, string[]>;
      locale?: string;
      photoSourceIds?: string[];
      prune?: boolean;
    },
  ): Promise<{ total: number; instructions: number; deleted: string[]; retired: string[] }>;
  export function setRetired(exec: Exec, slug: string, retired: boolean): Promise<boolean>;
}

declare module "@/scripts/lib/import-exercises.mjs" {
  type SourceRecord = {
    id: string;
    name: string;
    body_part: string;
    equipment: string;
    target: string;
    secondary_muscles?: string[];
    instruction_steps?: Record<string, string[]>;
    [key: string]: unknown;
  };
  export function slugify(text: string): string;
  export function displayName(name: string): string;
  export function deriveModality(
    record: Pick<SourceRecord, "id" | "name" | "body_part">,
    overrides?: Record<string, string>,
  ): string;
  export function buildCatalog(
    records: SourceRecord[],
    options?: {
      previous?: { sourceId?: string; slug: string }[];
      overrides?: Record<string, string>;
      supplement?: Record<string, unknown>[];
    },
  ): { catalog: Required<SeedExercise>[]; instructions: Record<string, string[]> };
  export function serializeCatalog(catalog: unknown[]): string;
  export function serializeInstructions(instructions: Record<string, string[]>): string;
}

declare module "@/scripts/lib/photo-match.mjs" {
  export function normalizeName(name: string): string;
  export function proposeMatches(
    catalog: { sourceId: string; name: string }[],
    photoEntries: { id: string; name: string; images?: string[] }[],
  ): Record<string, { id: string; how: "exact" | "words" }>;
}
