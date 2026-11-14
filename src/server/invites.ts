import { createHash, randomBytes } from "node:crypto";
import { isUuid, type Db } from "./db";
import { GroupFullError, NotFoundError, RateLimitedError } from "./errors";
import { ensureUser, requireOwner } from "./groups";

// docs/specs/group-invites-backend.md. Owner-only management of a group's invite links. The plaintext token exists
// only in the return value of createInvite; the table holds its hash (INV-2).

export const DEFAULT_EXPIRES_IN_DAYS = 7;
export const DEFAULT_MAX_USES = 10;
export const MAX_GROUP_MEMBERS = 30;
/** INV-11: this many failed lookups in the past hour and the user is blocked. */
export const MAX_FAILED_LOOKUPS = 10;

/** 32 random bytes as base64url is always 43 characters. Anything else can't be a token, so we never query for it. */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

export interface InviteOptions {
  expiresInDays?: number;
  maxUses?: number;
}
export interface InviteSummary {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  maxUses: number;
  useCount: number;
}

/** Fast hash on purpose: the token is 256 random bits, so the threat is guessing, not cracking a weak secret. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function wholeNumberBetween(value: number, min: number, max: number, name: string): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a whole number from ${min} to ${max}`);
  }
  return value;
}

/** INV-1 to INV-3. Returns the token once; it can't be read back. */
export async function createInvite(
  db: Db,
  userId: string,
  groupId: string,
  options: InviteOptions = {},
): Promise<{ id: string; token: string; expiresAt: Date; maxUses: number }> {
  await requireOwner(db, userId, groupId);
  const days = wholeNumberBetween(options.expiresInDays ?? DEFAULT_EXPIRES_IN_DAYS, 1, 30, "expiresInDays");
  const maxUses = wholeNumberBetween(options.maxUses ?? DEFAULT_MAX_USES, 1, 50, "maxUses");
  const token = randomBytes(32).toString("base64url");
  const rows = await db.query<{ id: string; expires_at: Date | string }>(
    `insert into group_invites (group_id, token_hash, created_by, expires_at, max_uses)
     values ($1::uuid, $2, $3, now() + make_interval(days => $4), $5)
     returning id, expires_at`,
    [groupId, hashToken(token), userId, days, maxUses],
  );
  return { id: rows[0].id, token, expiresAt: new Date(rows[0].expires_at), maxUses };
}

/** INV-4: active invites only (not revoked, not expired), never the token or hash. */
export async function listInvites(db: Db, userId: string, groupId: string): Promise<InviteSummary[]> {
  await requireOwner(db, userId, groupId);
  const rows = await db.query<{
    id: string;
    created_at: Date | string;
    expires_at: Date | string;
    max_uses: number;
    use_count: number;
  }>(
    `select id, created_at, expires_at, max_uses, use_count
     from group_invites
     where group_id = $1::uuid and revoked_at is null and expires_at > now()
     order by created_at desc, id`,
    [groupId],
  );
  return rows.map((r) => ({
    id: r.id,
    createdAt: new Date(r.created_at),
    expiresAt: new Date(r.expires_at),
    maxUses: r.max_uses,
    useCount: r.use_count,
  }));
}

/** INV-5. The group id in the where clause is what stops one group's owner revoking another group's invite. */
export async function revokeInvite(db: Db, userId: string, groupId: string, inviteId: string): Promise<void> {
  await requireOwner(db, userId, groupId);
  if (!isUuid(inviteId)) throw new NotFoundError();
  const rows = await db.query<{ id: string }>(
    `update group_invites set revoked_at = now()
     where id = $1::uuid and group_id = $2::uuid and revoked_at is null
     returning id`,
    [inviteId, groupId],
  );
  if (rows.length === 0) throw new NotFoundError();
}

// TODO(re-evaluate when invite_attempts exceeds 100k rows): purge rows older than the one-hour window.
async function assertNotRateLimited(db: Db, userId: string): Promise<void> {
  const rows = await db.query<{ n: number }>(
    "select count(*)::int as n from invite_attempts where user_id = $1 and at > now() - interval '1 hour'",
    [userId],
  );
  if (rows[0].n >= MAX_FAILED_LOOKUPS) throw new RateLimitedError();
}

/**
 * The shared front of preview and join (INV-7, INV-11): make sure the caller has a user row, refuse if they are
 * rate limited, then run `find` with the token's hash. `find` returns null for "no usable invite", which is recorded
 * as a failed attempt and answered with the one NotFoundError, whatever the reason was.
 */
async function withUsableToken<T>(
  db: Db,
  userId: string,
  token: string,
  find: (tokenHash: string) => Promise<T | null>,
): Promise<T> {
  await ensureUser(db, userId);
  await assertNotRateLimited(db, userId);
  const found = TOKEN_SHAPE.test(token) ? await find(hashToken(token)) : null;
  if (found === null) {
    await db.query("insert into invite_attempts (user_id) values ($1)", [userId]);
    throw new NotFoundError();
  }
  return found;
}

/** The invite is usable: not revoked, not expired, uses left (INV-6). */
const USABLE = "i.revoked_at is null and i.expires_at > now() and i.use_count < i.max_uses";

/** INV-6. Changes nothing except the caller's own user row and, on a bad token, their attempt count. */
export async function previewInvite(
  db: Db,
  userId: string,
  token: string,
): Promise<{ groupName: string; inviterId: string; memberCount: number; alreadyMember: boolean }> {
  return withUsableToken(db, userId, token, async (tokenHash) => {
    const rows = await db.query<{ name: string; inviter_id: string; member_count: number; already_member: boolean }>(
      `select g.name, i.created_by as inviter_id,
              (select count(*)::int from group_members where group_id = g.id) as member_count,
              exists (select 1 from group_members where group_id = g.id and user_id = $2) as already_member
       from group_invites i join groups g on g.id = i.group_id
       where i.token_hash = $1 and ${USABLE}`,
      [tokenHash, userId],
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return { groupName: r.name, inviterId: r.inviter_id, memberCount: r.member_count, alreadyMember: r.already_member };
  });
}

/**
 * INV-8 to INV-10, one statement. `claim` bumps the use count only while uses remain *at the moment of the update*,
 * so of two joins racing for the last use the second finds nothing to update and adds nobody. The member row is
 * inserted from `claim`, so a member is never added without a use being spent. An existing member skips both.
 */
export async function joinWithInvite(
  db: Db,
  userId: string,
  token: string,
): Promise<{ groupId: string; groupName: string; joined: boolean }> {
  return withUsableToken(db, userId, token, async (tokenHash) => {
    const rows = await db.query<{
      group_id: string;
      name: string;
      already_member: boolean;
      joined: boolean;
      member_count: number;
    }>(
      `with inv as (
         select i.id, i.group_id, g.name
         from group_invites i join groups g on g.id = i.group_id
         where i.token_hash = $1 and ${USABLE}
       ), mem as (
         select 1 from inv join group_members gm on gm.group_id = inv.group_id and gm.user_id = $2
       ), cnt as (
         select count(*)::int as n from group_members where group_id = (select group_id from inv)
       ), claim as (
         update group_invites set use_count = use_count + 1
         where id = (select id from inv)
           and not exists (select 1 from mem)
           and (select n from cnt) < $3::int
           and use_count < max_uses
         returning group_id
       ), ins as (
         insert into group_members (group_id, user_id, role)
         select group_id, $2, 'member' from claim
         on conflict do nothing
         returning group_id
       )
       select inv.group_id, inv.name,
              exists (select 1 from mem) as already_member,
              exists (select 1 from ins) as joined,
              (select n from cnt) as member_count
       from inv`,
      [tokenHash, userId, MAX_GROUP_MEMBERS],
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    if (r.already_member) return { groupId: r.group_id, groupName: r.name, joined: false };
    if (r.joined) return { groupId: r.group_id, groupName: r.name, joined: true };
    // Not added: either the group is full, or another join took the last use between our check and our update.
    if (r.member_count >= MAX_GROUP_MEMBERS) throw new GroupFullError();
    return null;
  });
}
