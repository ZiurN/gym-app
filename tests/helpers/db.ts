import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { drizzle } from "drizzle-orm/pglite";
import catalog from "@/data/exercise-catalog.json";
import journal from "@/drizzle/meta/_journal.json";
import * as schema from "@/lib/db/schema";
import { seedCatalog } from "@/scripts/lib/seed-catalog.mjs";

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;
export type Exec = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export const MIGRATION_TAGS = journal.entries.map((entry) => entry.tag);

export async function applyMigration(pg: PGlite, tag: string) {
  await pg.exec(
    readFileSync(new URL(`../../drizzle/${tag}.sql`, import.meta.url), "utf8"),
  );
}

export function execOf(pg: PGlite): Exec {
  return async (text, params = []) =>
    (await pg.query<Record<string, unknown>>(text, params)).rows;
}

/** A fresh in-process Postgres with migrations applied up to `count`. */
export async function createPg(count = MIGRATION_TAGS.length) {
  const pg = new PGlite();
  for (const tag of MIGRATION_TAGS.slice(0, count)) await applyMigration(pg, tag);
  return pg;
}

let current: TestDb | undefined;

/** Fully migrated database with the catalog seeded, installed as `@/lib/db`. */
export async function createTestDb() {
  const pg = await createPg();
  await seedCatalog(execOf(pg), catalog, randomUUID);
  current = drizzle(pg, { schema });
  return { pg, db: current, exec: execOf(pg) };
}

function requireCurrent(): TestDb {
  if (!current) throw new Error("createTestDb() was not called");
  return current;
}

/** Stand-in for `@/lib/db`; use with `vi.mock("@/lib/db", () => dbModuleMock)`. */
export const dbModuleMock = {
  getDb: requireCurrent,
  db: new Proxy({} as TestDb, {
    get(_target, prop, receiver) {
      const instance = requireCurrent();
      const value = Reflect.get(instance, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  }),
  // PGlite is a single session, so BEGIN/COMMIT around awaited queries gives
  // the same all-or-nothing behavior as the HTTP driver's batch.
  async runBatch(queries: BatchItem<"pg">[]) {
    const db = requireCurrent();
    await db.execute(sql`BEGIN`);
    try {
      for (const query of queries) await query;
      await db.execute(sql`COMMIT`);
    } catch (error) {
      await db.execute(sql`ROLLBACK`);
      throw error;
    }
  },
};

export async function insertUser(exec: Exec, email = `${randomUUID()}@example.com`) {
  const id = randomUUID();
  await exec(`INSERT INTO "user" (id, email) VALUES ($1, $2)`, [id, email]);
  return id;
}
