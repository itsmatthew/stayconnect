import { isUuid, type Db } from "./db";
import { NotFoundError } from "./errors";
import type { GroupRole } from "./groups";

const MAX_NAME_CHARACTERS = 50;
const MAX_AVATAR_URL_LENGTH = 2048;

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface MemberProfile extends Profile {
  role: GroupRole;
}

/** The parts of a Clerk user this layer needs, passed in as plain values so src/server never imports Clerk. */
export interface ClerkProfile {
  firstName: string | null;
  username: string | null;
  imageUrl: string | null;
  hasImage: boolean;
}

function firstNonBlank(...values: (string | null | undefined)[]): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

/** PRF-1: the name to show. Never empty, so a person without a name still appears. */
export function resolveName(parts: { displayName?: string | null; firstName?: string | null; username?: string | null }): string {
  return firstNonBlank(parts.displayName, parts.firstName, parts.username) ?? "Someone";
}

function toProfile(id: string, row: { display_name: string | null; avatar_url: string | null }): Profile {
  return { id, displayName: resolveName({ displayName: row.display_name }), avatarUrl: row.avatar_url };
}

/** Only an https link without whitespace is kept (PRF-2); the database check says the same. */
function safeAvatarUrl(url: string | null, hasImage: boolean): string | null {
  if (!hasImage || url === null) return null;
  return url.startsWith("https://") && url.length <= MAX_AVATAR_URL_LENGTH && /^\S+$/.test(url) ? url : null;
}

/** PRF-2. One statement: the user row, the name (only if none yet) and the image, together. */
export async function seedProfile(db: Db, userId: string, clerk: ClerkProfile | null): Promise<Profile> {
  const name = clerk ? firstNonBlank(clerk.firstName, clerk.username) : null;
  const clipped = name === null ? null : [...name].slice(0, MAX_NAME_CHARACTERS).join("").trimEnd();
  // TODO(re-evaluate when users need an avatar different from their sign-in account): upload to our own private storage instead of copying Clerk's link.
  const avatar = clerk ? safeAvatarUrl(clerk.imageUrl, clerk.hasImage) : null;
  const rows = await db.query<{ display_name: string | null; avatar_url: string | null }>(
    `insert into users (id, display_name, avatar_url) values ($1, $2, $3)
     on conflict (id) do update set
       display_name = coalesce(users.display_name, excluded.display_name),
       avatar_url = case when $4::boolean then excluded.avatar_url else users.avatar_url end
     returning display_name, avatar_url`,
    [userId, clipped, avatar, clerk !== null],
  );
  return toProfile(userId, rows[0]);
}

/** PRF-3. Trimmed here (SQL trim() only strips spaces, not tabs or newlines); the check constraint rejects blank or over-long names. */
export async function updateDisplayName(db: Db, userId: string, name: string): Promise<Profile> {
  const rows = await db.query<{ display_name: string | null; avatar_url: string | null }>(
    `insert into users (id, display_name) values ($1, $2)
     on conflict (id) do update set display_name = excluded.display_name
     returning display_name, avatar_url`,
    [userId, name.trim()],
  );
  return toProfile(userId, rows[0]);
}

/** PRF-4. The caller's own membership row is part of the join, so a non-member gets no rows. */
export async function getProfiles(db: Db, userId: string, groupId: string): Promise<MemberProfile[]> {
  if (!isUuid(groupId)) throw new NotFoundError();
  const rows = await db.query<{ id: string; display_name: string | null; avatar_url: string | null; role: GroupRole }>(
    `select gm.user_id as id, u.display_name, u.avatar_url, gm.role
       from group_members me
       join group_members gm on gm.group_id = me.group_id
       join users u on u.id = gm.user_id
      where me.group_id = $1::uuid and me.user_id = $2
      order by (gm.role = 'owner') desc, gm.joined_at, gm.user_id`,
    [groupId, userId],
  );
  if (rows.length === 0) throw new NotFoundError();
  return rows.map((r) => ({ ...toProfile(r.id, r), role: r.role }));
}
