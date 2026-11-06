import { createHash, randomBytes } from "node:crypto";
import { isUuid, type Db } from "./db";
import { NotFoundError } from "./errors";
import { requireOwner } from "./groups";

// docs/specs/group-invites-backend.md. Owner-only management of a group's invite links. The plaintext token exists
// only in the return value of createInvite; the table holds its hash (INV-2).

export const DEFAULT_EXPIRES_IN_DAYS = 7;
export const DEFAULT_MAX_USES = 10;

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
