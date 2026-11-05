import { isUuid, type Db } from "./db";
import { NotFoundError } from "./errors";

export type GroupRole = "owner" | "member";

export async function ensureUser(db: Db, userId: string): Promise<void> {
  await db.query("insert into users (id) values ($1) on conflict do nothing", [userId]);
}

/** One statement, so a group never exists without its owner (BE-1). */
export async function createGroup(db: Db, userId: string, name: string): Promise<{ id: string; name: string }> {
  await ensureUser(db, userId);
  const rows = await db.query<{ id: string; name: string }>(
    `with g as (
       insert into groups (name, created_by) values (trim($2), $1) returning id, name
     ), m as (
       insert into group_members (group_id, user_id, role) select id, $1, 'owner' from g
     )
     select id, name from g`,
    [userId, name],
  );
  return rows[0];
}

/** The check every group-scoped operation starts with (BE-2). Returns the caller's role. */
export async function requireMember(db: Db, userId: string, groupId: string): Promise<GroupRole> {
  if (!isUuid(groupId)) throw new NotFoundError();
  const rows = await db.query<{ role: GroupRole }>(
    "select role from group_members where group_id = $1::uuid and user_id = $2",
    [groupId, userId],
  );
  if (rows.length === 0) throw new NotFoundError();
  return rows[0].role;
}

/** The groups the user is in now, newest group first (BE-16). Only their own memberships are read. */
export async function listGroups(db: Db, userId: string): Promise<{ id: string; name: string; role: GroupRole }[]> {
  return db.query<{ id: string; name: string; role: GroupRole }>(
    `select g.id, g.name, gm.role
     from group_members gm
     join groups g on g.id = gm.group_id
     where gm.user_id = $1
     order by g.created_at desc, g.id`,
    [userId],
  );
}
