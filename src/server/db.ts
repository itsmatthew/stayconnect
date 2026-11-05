import { neon } from "@neondatabase/serverless";

/** The only database surface the server code uses, so tests can swap in an in-memory Postgres. */
export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

/** The real Neon database. Reads DATABASE_URL when called, so importing this file never needs it. */
export function getDb(): Db {
  const sql = neon(process.env.DATABASE_URL!);
  return { query: async <T>(text: string, params: unknown[] = []) => (await sql.query(text, params)) as T[] };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids from outside are checked first, so a malformed one is "not found" rather than a database error. */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
