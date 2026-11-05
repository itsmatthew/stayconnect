import { auth } from "@clerk/nextjs/server";
import { getDb } from "../../server/db";
import type { Deps } from "../../server/http/kit";

/**
 * The real dependencies for every API route. The only place that touches Clerk and Neon for HTTP.
 * The database is opened on first query, so a signed-out request never reaches it.
 */
export function deps(): Deps {
  return {
    db: { query: (text, params) => getDb().query(text, params) },
    getUserId: async () => (await auth()).userId,
  };
}
