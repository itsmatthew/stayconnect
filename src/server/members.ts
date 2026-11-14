import { isUuid, type Db } from "./db";
import { LastOwnerError, NotFoundError } from "./errors";

// docs/specs/group-membership.md. Leaving is removing yourself.

/**
 * GM-1 to GM-5, one statement so the last-owner check and the delete can't be separated. `allowed` is true only for a
 * caller who is in the group, a target who is in the group, and either the same person or an owner. Anything else
 * (non-member, other group, unknown target, plain member removing someone) is the same NotFoundError. The delete then
 * skips an owner who is the only owner. Their group_members row is the only thing removed, so their memories and
 * replies stay (BE-13), and access ends because every read joins group_members.
 */
export async function removeGroupMember(db: Db, userId: string, groupId: string, targetUserId: string): Promise<void> {
  if (!isUuid(groupId)) throw new NotFoundError();
  const rows = await db.query<{ allowed: boolean; removed: boolean }>(
    `with caller as (
       select role from group_members where group_id = $1::uuid and user_id = $2
     ), target as (
       select role from group_members where group_id = $1::uuid and user_id = $3
     ), allowed as (
       select 1 as ok
       where exists (select 1 from caller) and exists (select 1 from target)
         and ($2 = $3 or (select role from caller) = 'owner')
     ), owners as (
       select count(*)::int as n from group_members where group_id = $1::uuid and role = 'owner'
     ), del as (
       delete from group_members
       where group_id = $1::uuid and user_id = $3
         and exists (select 1 from allowed)
         and not ((select role from target) = 'owner' and (select n from owners) <= 1)
       returning user_id
     )
     select exists (select 1 from allowed) as allowed, exists (select 1 from del) as removed`,
    [groupId, userId, targetUserId],
  );
  if (rows[0].removed) return;
  if (!rows[0].allowed) throw new NotFoundError();
  throw new LastOwnerError();
}
