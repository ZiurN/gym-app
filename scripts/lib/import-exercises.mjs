/**
 * Turns records of hasaneyldrm/exercises-dataset into this app's catalog.
 * Only text data is read; the dataset's image and GIF fields are never copied.
 * See docs/CATALOG.md.
 */

const TARGET_TO_GROUP = {
  pectorals: "chest",
  "serratus anterior": "chest",
  lats: "back",
  "upper back": "back",
  spine: "back",
  delts: "shoulders",
  traps: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  quads: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  adductors: "glutes",
  abductors: "glutes",
  calves: "calves",
  abs: "core",
  "levator scapulae": "neck",
  "cardiovascular system": "cardio",
};

const EQUIPMENT_TO_GROUP = {
  "body weight": "bodyweight",
  weighted: "bodyweight",
  assisted: "bodyweight",
  barbell: "barbell",
  "ez barbell": "barbell",
  "olympic barbell": "barbell",
  "trap bar": "barbell",
  dumbbell: "dumbbell",
  cable: "cable",
  kettlebell: "kettlebell",
  "leverage machine": "machine",
  "sled machine": "machine",
  "smith machine": "machine",
  "upper body ergometer": "machine",
  "skierg machine": "machine",
  "stationary bike": "machine",
  "elliptical machine": "machine",
  "stepmill machine": "machine",
  band: "band",
  "resistance band": "band",
  "stability ball": "other",
  "medicine ball": "other",
  "bosu ball": "other",
  roller: "other",
  "wheel roller": "other",
  rope: "other",
  hammer: "other",
  tire: "other",
};

const TIMED_WORDS =
  /\b(plank|hold|hang|stretch|wall sit|carry|walk|run|l sit|isometric)\b/;
const ONE_LIMB_WORDS =
  /\b(one arm|single arm|one leg|single leg|one handed|one hand)\b/;

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * The dataset stores names in lower case, and a few carry a stray Cyrillic
 * letter before the degree sign ("45в°").
 */
export function displayName(name) {
  const text = name
    .trim()
    .replace(/\u0432°/g, "°")
    .replace(/\s+/g, " ")
    .replace(/\bez\b/g, "EZ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * How sets of the exercise are logged. The dataset has no such field, so it
 * is assigned by rule; `overrides` (source id -> modality) holds the reviewed
 * corrections and wins.
 */
export function deriveModality(record, overrides = {}) {
  if (overrides[record.id]) return overrides[record.id];
  const name = record.name.toLowerCase().replace(/-/g, " ");
  if (record.body_part === "cardio" || TIMED_WORDS.test(name)) return "time";
  if (ONE_LIMB_WORDS.test(name)) return "per_side";
  return "load_reps";
}

function need(map, value, kind, record) {
  const mapped = map[value];
  if (!mapped) {
    throw new Error(
      `Unmapped ${kind} "${value}" on exercise ${record.id} (${record.name}). Add it to scripts/lib/import-exercises.mjs.`,
    );
  }
  return mapped;
}

/**
 * @param records   the dataset's exercises.json
 * @param previous  the catalog generated last time; an exercise keeps the slug
 *                  it already has (matched by source id), so URLs and history
 *                  survive an upstream rename
 * @param supplement  exercises of our own that the dataset lacks, already in
 *                  catalog terms (see data/exercise-supplement.json); they
 *                  follow the dataset's entries
 * @returns the catalog entries and the English steps keyed by slug
 */
export function buildCatalog(
  records,
  { previous = [], overrides = {}, supplement = [] } = {},
) {
  const keptSlugs = new Map(
    previous.filter((e) => e.sourceId).map((e) => [e.sourceId, e.slug]),
  );
  const taken = new Set(keptSlugs.values());
  const catalog = [];
  const instructions = {};

  for (const record of [...records].sort((a, b) => a.id.localeCompare(b.id))) {
    let slug = keptSlugs.get(record.id);
    if (!slug) {
      slug = slugify(record.name);
      if (taken.has(slug)) slug = `${slug}-${record.id}`;
      taken.add(slug);
    }

    const steps = (record.instruction_steps?.en ?? [])
      .map((step) => String(step).trim())
      .filter(Boolean);
    if (steps.length === 0) {
      throw new Error(`Exercise ${record.id} (${record.name}) has no English steps.`);
    }

    catalog.push({
      sourceId: record.id,
      slug,
      name: displayName(record.name),
      modality: deriveModality(record, overrides),
      primaryMuscle: need(TARGET_TO_GROUP, record.target, "target", record),
      equipment: need(EQUIPMENT_TO_GROUP, record.equipment, "equipment", record),
      targetMuscle: record.target,
      secondaryMuscles: [...new Set(record.secondary_muscles ?? [])],
      equipmentDetail: record.equipment,
    });
    instructions[slug] = steps;
  }

  const groups = {
    primaryMuscle: new Set(Object.values(TARGET_TO_GROUP)),
    equipment: new Set(Object.values(EQUIPMENT_TO_GROUP)),
    modality: new Set(["load_reps", "time", "per_side"]),
  };
  const sourceIds = new Set(catalog.map((entry) => entry.sourceId));
  for (const extra of supplement) {
    for (const [field, allowed] of Object.entries(groups)) {
      if (!allowed.has(extra[field])) {
        throw new Error(`Supplement exercise ${extra.id}: unknown ${field} "${extra[field]}".`);
      }
    }
    const steps = (extra.steps ?? []).map((step) => String(step).trim()).filter(Boolean);
    if (!extra.id || sourceIds.has(extra.id) || !extra.name || steps.length === 0) {
      throw new Error(`Supplement exercise ${extra.id ?? "(no id)"} needs a unique id, a name and steps.`);
    }
    sourceIds.add(extra.id);

    let slug = keptSlugs.get(extra.id);
    if (!slug) {
      slug = slugify(extra.name);
      if (taken.has(slug)) slug = `${slug}-${slugify(extra.id)}`;
      taken.add(slug);
    }
    catalog.push({
      sourceId: extra.id,
      slug,
      name: displayName(extra.name),
      modality: extra.modality,
      primaryMuscle: extra.primaryMuscle,
      equipment: extra.equipment,
      targetMuscle: extra.targetMuscle,
      secondaryMuscles: [...new Set(extra.secondaryMuscles ?? [])],
      equipmentDetail: extra.equipmentDetail,
    });
    instructions[slug] = steps;
  }

  return { catalog, instructions };
}

/** One entry per line, so a re-import produces a readable diff. */
export function serializeCatalog(catalog) {
  return `[\n${catalog.map((entry) => `  ${JSON.stringify(entry)}`).join(",\n")}\n]\n`;
}

export function serializeInstructions(instructions) {
  const lines = Object.keys(instructions)
    .sort()
    .map((slug) => `  ${JSON.stringify(slug)}: ${JSON.stringify(instructions[slug])}`);
  return `{\n${lines.join(",\n")}\n}\n`;
}
