#!/usr/bin/env node
/**
 * Exercise catalog maintenance. See docs/CATALOG.md.
 *
 *   npm run db:seed-catalog
 *   node scripts/catalog.mjs retire <slug>
 *   node scripts/catalog.mjs unretire <slug>
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createNeonExec } from "./lib/neon-exec.mjs";
import { seedCatalog, setRetired } from "./lib/seed-catalog.mjs";

const [command, slug] = process.argv.slice(2);

async function main() {
  if (command === "seed") {
    const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
    const photoMap = new URL("../data/exercise-photo-map.json", import.meta.url);
    const exercises = read("../data/exercise-catalog.json");
    const result = await seedCatalog(createNeonExec(), exercises, randomUUID, {
      instructions: read("../data/exercise-instructions.en.json"),
      photoSourceIds: existsSync(photoMap) ? Object.keys(read(photoMap.href)) : [],
      prune: true,
    });
    console.log(`Upserted ${exercises.length} exercises; catalog now has ${result.total}.`);
    console.log(`Instructions written for ${result.instructions} exercises.`);
    console.log(`Removed ${result.deleted.length} exercises that are no longer in the seed.`);
    if (result.retired.length > 0) {
      console.log(`Retired (still referenced): ${result.retired.join(", ")}`);
    }
    return;
  }
  if ((command === "retire" || command === "unretire") && slug) {
    const found = await setRetired(createNeonExec(), slug, command === "retire");
    if (!found) throw new Error(`No exercise with slug "${slug}"`);
    console.log(`${slug}: ${command === "retire" ? "retired" : "available again"}`);
    return;
  }
  console.log("Usage: catalog.mjs seed | retire <slug> | unretire <slug>");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
