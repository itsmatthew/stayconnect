import { Client } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const client = new Client(process.env.DATABASE_URL);
await client.connect();

const migration = readFileSync(
  new URL("../db/migrations/0001_init.sql", import.meta.url),
  "utf8",
);
await client.query(migration);

await client.end();
console.log("Migration applied.");
