import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

/** `exec(text, params)` against DATABASE_URL, resolving to the rows. */
export function createNeonExec() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (.env.local)");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  return (text, params = []) => sql.query(text, params);
}
