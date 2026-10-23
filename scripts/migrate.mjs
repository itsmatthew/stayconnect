import { Client } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "node:fs";

// Runs every file in db/migrations in numeric order. Each migration must be idempotent (`if not exists`),
// so re-running is harmless (docs/specs/memories-backend.md BE-14).
const dir = new URL("../db/migrations/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new Client(process.env.DATABASE_URL);
await client.connect();

for (const file of files) {
  await client.query(readFileSync(new URL(file, dir), "utf8"));
  console.log(`Applied ${file}`);
}

await client.end();
console.log("Migrations applied.");
