import { isUuid, type Db } from "./db";
import { NoRecipientsError, NotFoundError } from "./errors";
import { requireMember } from "./groups";

// docs/specs/memories-backend.md. Every query joins `group_members` for the person asking, so leaving a group
// ends access at once (BE-13), and every one skips deleted or expired rows (BE-6, BE-12).

export interface Memory {
  id: string;
  groupId: string;
  senderId: string;
  caption: string;
  photoKey: string | null;
  createdAt: Date;
}
export interface InboxMemory extends Memory {
  replied: boolean;
}
export interface SentMemory extends Memory {
  replies: { userId: string; createdAt: Date }[];
}

interface MemoryRow {
  id: string;
  group_id: string;
  sender_id: string;
  caption: string;
  photo_key: string | null;
  created_at: Date | string;
}

const toMemory = (r: MemoryRow): Memory => ({
  id: r.id,
  groupId: r.group_id,
  senderId: r.sender_id,
  caption: r.caption,
  photoKey: r.photo_key,
  createdAt: new Date(r.created_at),
});

/** BE-6. */
export const RETENTION_DAYS = 60;

// TODO(re-evaluate when real users have sent memories, before the friends rollout): a scheduled job that hard-deletes
// rows past `expires_at` or with `deleted_at` set, plus their stored photos. Until then they're only hidden (BE-6, BE-12).

const COLUMNS = "m.id, m.group_id, m.sender_id, m.caption, m.photo_key, m.created_at";
const LIVE = "m.deleted_at is null and m.expires_at > now()";

/** Memory and recipients are written by one statement, so both happen or neither does (BE-5). */
export async function sendMemory(
  db: Db,
  userId: string,
  input: { groupId: string; caption: string; photoKey?: string | null },
): Promise<{ id: string }> {
  await requireMember(db, userId, input.groupId);
  const rows = await db.query<{ id: string }>(
    `with m as (
       insert into memories (group_id, sender_id, caption, photo_key, expires_at)
       select $1::uuid, $2, $3, $4, now() + make_interval(days => $5)
       where exists (select 1 from group_members where group_id = $1::uuid and user_id <> $2)
       returning id
     ), r as (
       insert into memory_recipients (memory_id, user_id)
       select m.id, gm.user_id from m, group_members gm where gm.group_id = $1::uuid and gm.user_id <> $2
     )
     select id from m`,
    [input.groupId, userId, input.caption, input.photoKey ?? null, RETENTION_DAYS],
  );
  if (rows.length === 0) throw new NoRecipientsError();
  return rows[0];
}

export async function listInbox(db: Db, userId: string): Promise<InboxMemory[]> {
  const rows = await db.query<MemoryRow & { replied: boolean }>(
    `select ${COLUMNS}, (r.user_id is not null) as replied
     from memory_recipients mr
     join memories m on m.id = mr.memory_id
     join group_members gm on gm.group_id = m.group_id and gm.user_id = mr.user_id
     left join memory_replies r on r.memory_id = m.id and r.user_id = mr.user_id
     where mr.user_id = $1 and ${LIVE}
     order by m.created_at desc, m.id`,
    [userId],
  );
  return rows.map((r) => ({ ...toMemory(r), replied: r.replied }));
}

/** Sealed until reply (BE-8): the inner join to replies from current members leaves out unreplied memories. */
export async function listSent(db: Db, userId: string): Promise<SentMemory[]> {
  const rows = await db.query<MemoryRow & { replies: { userId: string; createdAt: string }[] }>(
    `select ${COLUMNS},
            json_agg(json_build_object('userId', r.user_id, 'createdAt', r.created_at) order by r.created_at) as replies
     from memories m
     join group_members sm on sm.group_id = m.group_id and sm.user_id = m.sender_id
     join memory_replies r on r.memory_id = m.id
     join group_members rm on rm.group_id = m.group_id and rm.user_id = r.user_id
     where m.sender_id = $1 and ${LIVE}
     group by m.id
     order by m.created_at desc, m.id`,
    [userId],
  );
  return rows.map((r) => ({
    ...toMemory(r),
    replies: r.replies.map((x) => ({ userId: x.userId, createdAt: new Date(x.createdAt) })),
  }));
}

/** A recipient, or the sender once unsealed. Every other case looks the same as a missing id (BE-9). */
export async function getMemory(db: Db, userId: string, memoryId: string): Promise<Memory> {
  if (!isUuid(memoryId)) throw new NotFoundError();
  const rows = await db.query<MemoryRow>(
    `select ${COLUMNS} from memories m
     where m.id = $1::uuid and ${LIVE}
       and (
         exists (select 1 from memory_recipients mr
                 join group_members gm on gm.group_id = m.group_id and gm.user_id = mr.user_id
                 where mr.memory_id = m.id and mr.user_id = $2)
         or (m.sender_id = $2
             and exists (select 1 from group_members where group_id = m.group_id and user_id = $2)
             and exists (select 1 from memory_replies r
                         join group_members rm on rm.group_id = m.group_id and rm.user_id = r.user_id
                         where r.memory_id = m.id))
       )`,
    [memoryId, userId],
  );
  if (rows.length === 0) throw new NotFoundError();
  return toMemory(rows[0]);
}

/** Idempotent (BE-11). `eligible` is empty for the sender, outsiders, ex-members, and dead memories (BE-10). */
export async function replyToMemory(db: Db, userId: string, memoryId: string): Promise<void> {
  if (!isUuid(memoryId)) throw new NotFoundError();
  const rows = await db.query<{ eligible: string }>(
    `with eligible as (
       select m.id from memories m
       join memory_recipients mr on mr.memory_id = m.id and mr.user_id = $2
       join group_members gm on gm.group_id = m.group_id and gm.user_id = $2
       where m.id = $1::uuid and ${LIVE}
     ), ins as (
       insert into memory_replies (memory_id, user_id) select id, $2 from eligible on conflict do nothing
     )
     select count(*)::text as eligible from eligible`,
    [memoryId, userId],
  );
  if (rows[0].eligible === "0") throw new NotFoundError();
}

/** Soft delete by the sender only (BE-12). Rows and photos are purged by the TODO job above. */
export async function deleteMemory(db: Db, userId: string, memoryId: string): Promise<void> {
  if (!isUuid(memoryId)) throw new NotFoundError();
  const rows = await db.query<{ id: string }>(
    `update memories m set deleted_at = now()
     where m.id = $1::uuid and m.sender_id = $2 and ${LIVE}
     returning m.id`,
    [memoryId, userId],
  );
  if (rows.length === 0) throw new NotFoundError();
}
