#!/usr/bin/env node
/**
 * Dev-only helpers for workout data.
 *
 *   npm run db:seed-workouts                     sample routine + finished sessions
 *   npm run db:seed-workouts -- --email x@y.com
 *   npm run db:reset-workouts                    delete sessions, sets and unit preferences
 *   npm run db:reset-workouts -- --email x@y.com
 *
 * Needs the catalog (npm run db:seed-catalog). Auth tables are never touched.
 */
import { randomUUID } from "node:crypto";
import { createNeonExec } from "./lib/neon-exec.mjs";

const exec = createNeonExec();

const ROUTINE_NAME = "Sample upper/lower";

const ex = (slug, targetSets, repMin, repMax, restSeconds, extra = {}) => ({
  slug, targetSets, repMin, repMax, restSeconds, supersetGroup: null, alternativeSlug: null, ...extra,
});

const DAYS = [
  {
    name: "Upper",
    exercises: [
      ex("barbell-bench-press", 3, 5, 8, 150),
      ex("barbell-bent-over-row", 3, 6, 10, 150),
      ex("pull-up", 3, 6, 10, 120, { alternativeSlug: "cable-pulldown" }),
      ex("barbell-curl", 3, 10, 12, 60, { supersetGroup: 1 }),
      ex("cable-pushdown", 3, 10, 12, 60, { supersetGroup: 1 }),
    ],
    // [slug, load in kg, reps] per set, for sessions 21, 14 and 7 days ago
    sessions: [
      [["barbell-bench-press", 60, 8], ["barbell-bench-press", 60, 7], ["barbell-bent-over-row", 50, 10], ["pull-up", 0, 6]],
      [["barbell-bench-press", 62.5, 8], ["barbell-bench-press", 62.5, 7], ["barbell-bent-over-row", 52.5, 10], ["pull-up", 0, 7]],
      [["barbell-bench-press", 65, 7], ["barbell-bench-press", 65, 6], ["barbell-bent-over-row", 55, 9], ["pull-up", 0, 8]],
    ],
  },
  {
    name: "Lower",
    exercises: [
      ex("barbell-full-squat", 3, 5, 8, 150),
      ex("barbell-deadlift", 3, 5, 8, 150),
      ex("weighted-front-plank", 2, null, null, 60),
    ],
    sessions: [
      [["barbell-full-squat", 75, 6], ["barbell-full-squat", 75, 5], ["barbell-deadlift", 90, 6]],
      [["barbell-full-squat", 77.5, 6], ["barbell-full-squat", 77.5, 5], ["barbell-deadlift", 95, 6]],
      [["barbell-full-squat", 80, 6], ["barbell-full-squat", 80, 5], ["barbell-deadlift", 100, 5]],
    ],
  },
];

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function assertDevSafe() {
  if (process.env.FORCE === "1") return;
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    console.error("Refusing to run: this looks like production. Set FORCE=1 to override.");
    process.exit(1);
  }
}

async function resolveUser(email = process.env.WORKOUT_DEV_USER_EMAIL) {
  const rows = email
    ? await exec(`SELECT id, email FROM "user" WHERE email = $1 LIMIT 1`, [email])
    : await exec(`SELECT id, email FROM "user" ORDER BY id LIMIT 1`);
  if (rows.length === 0) {
    throw new Error(email ? `No user with email ${email}` : "No users yet. Sign in once first.");
  }
  return rows[0];
}

async function reset(email) {
  assertDevSafe();
  const scope = email ? [(await resolveUser(email)).id] : null;
  const where = scope ? `WHERE "userId" = $1` : "";
  // Sets go with their sessions (cascade).
  const sessions = await exec(`DELETE FROM workout_session ${where} RETURNING id`, scope ?? []);
  const prefs = await exec(`DELETE FROM exercise_preference ${where} RETURNING "userId"`, scope ?? []);
  console.log(
    `Deleted ${sessions.length} sessions (with their sets) and ${prefs.length} unit preferences for ${email ?? "ALL users"}.`,
  );
}

async function ensureRoutine(userId, ids) {
  const [existing] = await exec(
    `SELECT id FROM routine WHERE "userId" = $1 AND name = $2 LIMIT 1`,
    [userId, ROUTINE_NAME],
  );
  if (!existing) {
    const routineId = randomUUID();
    const [{ active }] = await exec(
      `SELECT count(*)::int AS active FROM routine WHERE "userId" = $1 AND "isActive"`,
      [userId],
    );
    await exec(`INSERT INTO routine (id, "userId", name, "isActive") VALUES ($1, $2, $3, $4)`, [
      routineId, userId, ROUTINE_NAME, active === 0,
    ]);
    for (const [dayPosition, day] of DAYS.entries()) {
      const dayId = randomUUID();
      await exec(`INSERT INTO routine_day (id, "routineId", name, position) VALUES ($1, $2, $3, $4)`, [
        dayId, routineId, day.name, dayPosition,
      ]);
      for (const [position, e] of day.exercises.entries()) {
        await exec(
          `INSERT INTO routine_exercise (
             id, "routineDayId", "exerciseId", position, "targetSets", "restSeconds",
             "repMin", "repMax", "supersetGroup", "alternativeExerciseId"
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            randomUUID(), dayId, ids[e.slug], position, e.targetSets, e.restSeconds,
            e.repMin, e.repMax, e.supersetGroup, e.alternativeSlug ? ids[e.alternativeSlug] : null,
          ],
        );
      }
    }
  }
  const days = await exec(
    `SELECT d.id, d.name FROM routine_day d JOIN routine r ON r.id = d."routineId"
     WHERE r."userId" = $1 AND r.name = $2`,
    [userId, ROUTINE_NAME],
  );
  return Object.fromEntries(days.map((day) => [day.name, day.id]));
}

async function seed(email) {
  assertDevSafe();
  const user = await resolveUser(email);
  const slugs = [...new Set(DAYS.flatMap((d) => d.exercises.flatMap((e) => [e.slug, e.alternativeSlug])).filter(Boolean))];
  const rows = await exec(`SELECT id, slug FROM exercise WHERE slug = ANY($1::text[])`, [slugs]);
  const ids = Object.fromEntries(rows.map((row) => [row.slug, row.id]));
  const missing = slugs.filter((slug) => !ids[slug]);
  if (missing.length > 0) {
    throw new Error(`Not in the catalog: ${missing.join(", ")}. Run: npm run db:seed-catalog`);
  }

  const dayIds = await ensureRoutine(user.id, ids);
  let sessionCount = 0;
  for (const day of DAYS) {
    for (const [index, sets] of day.sessions.entries()) {
      const completedAt = new Date(Date.now() - (21 - index * 7) * 86_400_000);
      const sessionId = randomUUID();
      await exec(
        `INSERT INTO workout_session (id, "userId", "routineDayId", "dayName", status, "startedAt", "completedAt")
         VALUES ($1, $2, $3, $4, 'completed', $5, $6)`,
        [sessionId, user.id, dayIds[day.name], day.name, new Date(completedAt.getTime() - 45 * 60_000), completedAt],
      );
      const setIndex = {};
      for (const [slug, load, reps] of sets) {
        setIndex[slug] = (setIndex[slug] ?? 0) + 1;
        await exec(
          `INSERT INTO workout_set (id, "sessionId", "userId", "exerciseId", "setIndex", modality, load, "weightUnit", reps, "completedAt")
           VALUES ($1, $2, $3, $4, $5, 'load_reps', $6, 'kg', $7, $8)`,
          [randomUUID(), sessionId, user.id, ids[slug], setIndex[slug], load, reps, completedAt],
        );
      }
      sessionCount += 1;
    }
  }
  console.log(`Seeded routine "${ROUTINE_NAME}" and ${sessionCount} finished sessions for ${user.email}.`);
  console.log("Try: /train, /routines and /progress/barbell-bench-press");
}

const command = process.argv[2];
const run = command === "reset" ? reset : command === "seed" ? seed : null;
if (!run) {
  console.log("Usage: workout-dev.mjs seed|reset [--email user@example.com]");
} else {
  run(option("--email")).catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
