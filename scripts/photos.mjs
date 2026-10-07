#!/usr/bin/env node
/**
 * Start and end photos from free-exercise-db. See docs/CATALOG.md.
 *
 *   node scripts/photos.mjs propose <path to free-exercise-db exercises.json>
 *       prints name matches that are not in data/exercise-photo-map.json yet
 *   node scripts/photos.mjs fetch <path to exercises.json> <revision>
 *       downloads and resizes the photos of every mapped exercise
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { proposeMatches } from "./lib/photo-match.mjs";

const at = (path) => new URL(path, import.meta.url);
const readJson = (url) => JSON.parse(readFileSync(url, "utf8"));
const [command, sourcePath, revision] = process.argv.slice(2);

if (!["propose", "fetch"].includes(command) || !sourcePath) {
  console.log("Usage: photos.mjs propose <exercises.json> | fetch <exercises.json> <revision>");
  process.exit(1);
}

const catalog = readJson(at("../data/exercise-catalog.json"));
const photoEntries = readJson(sourcePath);
const map = readJson(at("../data/exercise-photo-map.json"));

if (command === "propose") {
  const bySource = new Map(catalog.map((e) => [e.sourceId, e]));
  const byId = new Map(photoEntries.map((e) => [e.id, e]));
  const taken = new Set(Object.values(map));
  const fresh = Object.entries(proposeMatches(catalog, photoEntries)).filter(
    ([sourceId, match]) => !map[sourceId] && !taken.has(match.id),
  );
  for (const [sourceId, match] of fresh) {
    console.log(`${sourceId}\t${match.how}\t${bySource.get(sourceId).name}\t=>\t${byId.get(match.id).name}\t(${match.id})`);
  }
  console.log(`${fresh.length} new proposals; ${Object.keys(map).length} already mapped.`);
  process.exit(0);
}

if (!revision) {
  console.error("fetch needs the free-exercise-db revision the photos are taken from.");
  process.exit(1);
}
const bySource = new Map(catalog.map((e) => [e.sourceId, e]));
const byId = new Map(photoEntries.map((e) => [e.id, e]));
const jobs = Object.entries(map).flatMap(([sourceId, photoId]) => {
  const exercise = bySource.get(sourceId);
  const entry = byId.get(photoId);
  if (!exercise || !entry || entry.images.length < 2) {
    throw new Error(`Bad mapping ${sourceId} -> ${photoId}`);
  }
  return ["start", "end"].map((position, index) => ({
    url: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${revision}/exercises/${entry.images[index]
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    dir: at(`../public/exercise-photos/${exercise.slug}/`),
    file: at(`../public/exercise-photos/${exercise.slug}/${position}.webp`),
  }));
});

let bytes = 0;
let largest = 0;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const response = await fetch(job.url);
      if (!response.ok) throw new Error(`${response.status} for ${job.url}`);
      const image = await sharp(Buffer.from(await response.arrayBuffer()))
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer();
      mkdirSync(job.dir, { recursive: true });
      writeFileSync(job.file, image);
      const { size } = statSync(job.file);
      bytes += size;
      largest = Math.max(largest, size);
    }
  }),
);
console.log(
  `Wrote ${jobs.length} photos for ${jobs.length / 2} exercises: ${(bytes / 1e6).toFixed(1)} MB in total, largest ${(largest / 1e3).toFixed(0)} KB.`,
);
