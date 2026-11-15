import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { createGroup } from "../../src/server/groups";
import { NotFoundError } from "../../src/server/errors";
import { createInvite, hashToken, listInvites, revokeInvite } from "../../src/server/invites";
import type { Db } from "../../src/server/db";
import { addMember, newTestDb } from "./helpers";

let db: Db;
let groupId: string;

// alice owns the group; bea is a member; mallory is in no group.
beforeEach(async () => {
  ({ db } = await newTestDb());
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
  await db.query("insert into users (id) values ('mallory')");
});

const count = async () => Number((await db.query<{ n: string }>("select count(*) n from group_invites"))[0].n);
const NO_SUCH = "00000000-0000-4000-8000-000000000000";

describe("creating (INV-1, INV-2)", () => {
  it("INV-1: the owner creates an invite", async () => {
    const invite = await createInvite(db, "alice", groupId);
    expect(invite.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await count()).toBe(1);
  });

  it("INV-1: a plain member, a non-member, an unknown group, and a malformed id all get NotFoundError and store nothing", async () => {
    for (const [user, group] of [["bea", groupId], ["mallory", groupId], ["alice", NO_SUCH], ["alice", "not-a-uuid"]]) {
      await expect(createInvite(db, user, group)).rejects.toBeInstanceOf(NotFoundError);
    }
    expect(await count()).toBe(0);
  });

  it("INV-2: the token is 32 random bytes as base64url, and each invite gets a different one", async () => {
    const a = await createInvite(db, "alice", groupId);
    const b = await createInvite(db, "alice", groupId);
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a.token).not.toBe(b.token);
  });

  it("INV-2: only the SHA-256 of the token is stored, never the token", async () => {
    const { token } = await createInvite(db, "alice", groupId);
    const rows = await db.query<Record<string, unknown>>("select * from group_invites");
    expect(rows[0].token_hash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(hashToken(token)).toBe(rows[0].token_hash);
    expect(JSON.stringify(rows)).not.toContain(token);
  });
});

describe("limits (INV-3)", () => {
  it("INV-3: defaults to 7 days and 10 uses", async () => {
    const invite = await createInvite(db, "alice", groupId);
    expect(invite.maxUses).toBe(10);
    const days = (invite.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThanOrEqual(7);
  });

  it("INV-3: the boundaries 1 and 30 days, 1 and 50 uses are accepted", async () => {
    await createInvite(db, "alice", groupId, { expiresInDays: 1, maxUses: 1 });
    await createInvite(db, "alice", groupId, { expiresInDays: 30, maxUses: 50 });
    expect(await count()).toBe(2);
  });

  it.each([
    ["0 days", { expiresInDays: 0 }],
    ["31 days", { expiresInDays: 31 }],
    ["1.5 days", { expiresInDays: 1.5 }],
    ["NaN days", { expiresInDays: NaN }],
    ["0 uses", { maxUses: 0 }],
    ["51 uses", { maxUses: 51 }],
    ["2.5 uses", { maxUses: 2.5 }],
    ["negative uses", { maxUses: -1 }],
  ])("INV-3: %s is rejected and nothing is stored", async (_label, opts) => {
    await expect(createInvite(db, "alice", groupId, opts)).rejects.toBeInstanceOf(RangeError);
    expect(await count()).toBe(0);
  });
});

describe("listing (INV-4)", () => {
  it("INV-4: lists the active invites with exactly the safe fields, newest first", async () => {
    const first = await createInvite(db, "alice", groupId, { maxUses: 3 });
    const second = await createInvite(db, "alice", groupId);
    // Inserts in one test can share a timestamp, so make the order unambiguous.
    await db.query("update group_invites set created_at = now() - interval '1 hour' where id = $1", [first.id]);
    const list = await listInvites(db, "alice", groupId);
    expect(list.map((i) => i.id)).toEqual([second.id, first.id]);
    expect(Object.keys(list[1]).sort()).toEqual(["createdAt", "expiresAt", "id", "maxUses", "useCount"]);
    expect(list[1]).toMatchObject({ id: first.id, maxUses: 3, useCount: 0 });
    expect(list[1].createdAt).toBeInstanceOf(Date);
    expect(list[1].expiresAt).toBeInstanceOf(Date);
  });

  it("INV-4: leaves out revoked and expired invites", async () => {
    const revoked = await createInvite(db, "alice", groupId);
    const expired = await createInvite(db, "alice", groupId);
    const live = await createInvite(db, "alice", groupId);
    await revokeInvite(db, "alice", groupId, revoked.id);
    await db.query("update group_invites set expires_at = now() - interval '1 minute' where id = $1", [expired.id]);
    expect((await listInvites(db, "alice", groupId)).map((i) => i.id)).toEqual([live.id]);
  });

  it("INV-4: never includes another group's invites", async () => {
    const other = await createGroup(db, "alice", "Study abroad");
    await createInvite(db, "alice", other.id);
    expect(await listInvites(db, "alice", groupId)).toEqual([]);
  });

  it("INV-4: a plain member, a non-member, and an unknown group get NotFoundError", async () => {
    await createInvite(db, "alice", groupId);
    for (const [user, group] of [["bea", groupId], ["mallory", groupId], ["alice", NO_SUCH], ["alice", "not-a-uuid"]]) {
      await expect(listInvites(db, user, group)).rejects.toBeInstanceOf(NotFoundError);
    }
  });
});

describe("revoking (INV-5)", () => {
  it("INV-5: the owner revokes, and it leaves the active list", async () => {
    const invite = await createInvite(db, "alice", groupId);
    await revokeInvite(db, "alice", groupId, invite.id);
    expect(await listInvites(db, "alice", groupId)).toEqual([]);
    const rows = await db.query<{ revoked_at: Date | null }>("select revoked_at from group_invites");
    expect(rows[0].revoked_at).not.toBeNull();
  });

  it("INV-5: a plain member and a non-member get NotFoundError and the invite stays active", async () => {
    const invite = await createInvite(db, "alice", groupId);
    for (const user of ["bea", "mallory"]) {
      await expect(revokeInvite(db, user, groupId, invite.id)).rejects.toBeInstanceOf(NotFoundError);
    }
    expect(await listInvites(db, "alice", groupId)).toHaveLength(1);
  });

  it("INV-5: another group's invite id, an unknown id, and a malformed id are NotFoundError", async () => {
    const other = await createGroup(db, "alice", "Study abroad");
    const theirs = await createInvite(db, "alice", other.id);
    for (const id of [theirs.id, NO_SUCH, "not-a-uuid", "1; drop table group_invites"]) {
      await expect(revokeInvite(db, "alice", groupId, id)).rejects.toBeInstanceOf(NotFoundError);
    }
    expect(await listInvites(db, "alice", other.id)).toHaveLength(1);
  });

  it("INV-5: revoking twice is NotFoundError the second time", async () => {
    const invite = await createInvite(db, "alice", groupId);
    await revokeInvite(db, "alice", groupId, invite.id);
    await expect(revokeInvite(db, "alice", groupId, invite.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
