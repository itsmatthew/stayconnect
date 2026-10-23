import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Db } from "../../src/server/db";

const migrationsDir = new URL("../../db/migrations/", import.meta.url);

/** Applies every migration file in numeric order, the way scripts/migrate.mjs does. */
export async function applyMigrations(pg: PGlite): Promise<void> {
  const files = readdirSync(fileURLToPath(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await pg.exec(readFileSync(new URL(file, migrationsDir), "utf8"));
  }
}

/** A fresh in-memory Postgres with the real schema. Nothing here touches the real database. */
export async function newTestDb(): Promise<{ db: Db; pg: PGlite }> {
  const pg = new PGlite();
  await applyMigrations(pg);
  const db: Db = {
    async query<T>(text: string, params: unknown[] = []) {
      return (await pg.query<T>(text, params)).rows;
    },
  };
  return { db, pg };
}

/** Stand-in for the invites slice (not built yet): adds a member directly. */
export async function addMember(db: Db, groupId: string, userId: string): Promise<void> {
  await db.query("insert into users (id) values ($1) on conflict do nothing", [userId]);
  await db.query("insert into group_members (group_id, user_id, role) values ($1, $2, 'member')", [groupId, userId]);
}

export async function removeMember(db: Db, groupId: string, userId: string): Promise<void> {
  await db.query("delete from group_members where group_id = $1 and user_id = $2", [groupId, userId]);
}
