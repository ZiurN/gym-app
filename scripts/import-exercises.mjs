#!/usr/bin/env node
/**
 * Regenerates the catalog files from a downloaded copy of the dataset.
 * See docs/CATALOG.md for where to get it and which revision is in use.
 *
 *   node scripts/import-exercises.mjs .dataset-cache/exercises-dataset.json
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  buildCatalog,
  serializeCatalog,
  serializeInstructions,
} from "./lib/import-exercises.mjs";

const source = process.argv[2];
if (!source || !existsSync(source)) {
  console.error("Usage: node scripts/import-exercises.mjs <path to exercises.json>");
  process.exit(1);
}
const at = (path) => new URL(path, import.meta.url);
const readJson = (url, fallback) =>
  existsSync(url) ? JSON.parse(readFileSync(url, "utf8")) : fallback;

const { catalog, instructions } = buildCatalog(JSON.parse(readFileSync(source, "utf8")), {
  previous: readJson(at("../data/exercise-catalog.json"), []),
  overrides: readJson(at("../data/exercise-modality-overrides.json"), {}),
  supplement: readJson(at("../data/exercise-supplement.json"), []),
});
writeFileSync(at("../data/exercise-catalog.json"), serializeCatalog(catalog));
writeFileSync(at("../data/exercise-instructions.en.json"), serializeInstructions(instructions));

const count = (key) =>
  catalog.reduce((acc, e) => ({ ...acc, [e[key]]: (acc[e[key]] ?? 0) + 1 }), {});
console.log(`Wrote ${catalog.length} exercises.`);
console.log("By modality:", JSON.stringify(count("modality")));
