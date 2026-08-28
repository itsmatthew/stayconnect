import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export async function incrementAndGetVisits(): Promise<number> {
  const rows = await sql`
    update visits set count = count + 1 where id = 1 returning count
  `;
  return rows[0].count as number;
}
