/**
 * Proposes which free-exercise-db entry shows a catalog exercise, by name.
 * Proposals are for review; only data/exercise-photo-map.json is used.
 */

export function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((word) => (word === "dumbbells" ? "dumbbell" : word))
    .join(" ");
}

const wordKey = (name) => normalizeName(name).split(" ").sort().join(" ");

/**
 * @param catalog  entries with `sourceId` and `name`
 * @param photoEntries  free-exercise-db records with `id`, `name`, `images`
 * @returns `{ [sourceId]: { id, how } }`, where `how` is "exact" (same name)
 *   or "words" (same words in another order). Each photo entry is proposed
 *   for at most one exercise; exact matches take precedence.
 */
export function proposeMatches(catalog, photoEntries) {
  const usable = photoEntries.filter((entry) => (entry.images ?? []).length >= 2);
  const byName = new Map(usable.map((entry) => [normalizeName(entry.name), entry]));
  const byWords = new Map(usable.map((entry) => [wordKey(entry.name), entry]));
  const proposals = {};
  const used = new Set();

  for (const [how, lookup, key] of [
    ["exact", byName, normalizeName],
    ["words", byWords, wordKey],
  ]) {
    for (const exercise of catalog) {
      if (proposals[exercise.sourceId]) continue;
      const entry = lookup.get(key(exercise.name));
      if (!entry || used.has(entry.id)) continue;
      proposals[exercise.sourceId] = { id: entry.id, how };
      used.add(entry.id);
    }
  }
  return proposals;
}
