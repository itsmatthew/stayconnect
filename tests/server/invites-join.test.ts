import { beforeEach, describe, expect, it } from "vitest";
import { createGroup, requireMember } from "../../src/server/groups";
import { GroupFullError, NotFoundError, RateLimitedError } from "../../src/server/errors";
import {
  createInvite,
  joinWithInvite,
  MAX_FAILED_LOOKUPS,
  MAX_GROUP_MEMBERS,
  previewInvite,
  revokeInvite,
} from "../../src/server/invites";
import type { Db } from "../../src/server/db";
import { addMember, newTestDb } from "./helpers";

let db: Db;
let groupId: string;
let token: string;
let inviteId: string;

// alice owns the group; bea is a member. carol, dee and erin are signed in but in no group.
beforeEach(async () => {
  ({ db } = await newTestDb());
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
  ({ id: inviteId, token } = await createInvite(db, "alice", groupId));
});

const useCount = async () => (await db.query<{ n: number }>("select use_count n from group_invites where id = $1", [inviteId]))[0].n;
const memberCount = async () => Number((await db.query<{ n: string }>("select count(*) n from group_members where group_id = $1", [groupId]))[0].n);
const attempts = async (user: string) => Number((await db.query<{ n: string }>("select count(*) n from invite_attempts where user_id = $1", [user]))[0].n);
const WELL_FORMED_UNKNOWN = "A".repeat(43);

describe("previewing (INV-6)", () => {
  it("INV-6: a stranger sees the group name, inviter, and size, and joins nothing", async () => {
    expect(await previewInvite(db, "carol", token)).toEqual({
      groupName: "Sorority",
      inviterId: "alice",
      memberCount: 2,
      alreadyMember: false,
    });
    expect(await memberCount()).toBe(2);
    expect(await useCount()).toBe(0);
  });

  it("INV-6: a current member is told they are already in", async () => {
    expect((await previewInvite(db, "bea", token)).alreadyMember).toBe(true);
  });

  it("INV-6: a user who has never been seen before can preview", async () => {
    await expect(previewInvite(db, "newcomer", token)).resolves.toMatchObject({ groupName: "Sorority" });
  });
});

describe("bad tokens look identical (INV-7)", () => {
  async function badTokens(): Promise<[string, string][]> {
    const expired = await createInvite(db, "alice", groupId);
    await db.query("update group_invites set expires_at = now() - interval '1 minute' where id = $1", [expired.id]);
    const revoked = await createInvite(db, "alice", groupId);
    await revokeInvite(db, "alice", groupId, revoked.id);
    const usedUp = await createInvite(db, "alice", groupId, { maxUses: 1 });
    await joinWithInvite(db, "dee", usedUp.token);
    return [
      ["empty", ""],
      ["too short", "abc"],
      ["too long", "A".repeat(1000)],
      ["wrong characters", "!".repeat(43)],
      ["sql-looking", "1; drop table group_invites; --"],
      ["well-formed but unknown", WELL_FORMED_UNKNOWN],
      ["expired", expired.token],
      ["revoked", revoked.token],
      ["used up", usedUp.token],
    ];
  }

  it("INV-7: preview and join give the same NotFoundError for every bad token, and store nothing", async () => {
    const before = await memberCount();
    for (const [label, bad] of await badTokens()) {
      const user = `probe-${label.replace(/\W/g, "")}`; // a fresh user each time so the limiter doesn't interfere
      const p = await previewInvite(db, user, bad).catch((e) => e);
      const j = await joinWithInvite(db, user, bad).catch((e) => e);
      for (const err of [p, j]) {
        expect(err, label).toBeInstanceOf(NotFoundError);
        expect((err as Error).message, label).toBe("Not found");
      }
      expect(await db.query("select 1 from group_members where user_id = $1", [user]), label).toEqual([]);
    }
    expect(await memberCount()).toBe(before + 1); // only dee, from setting up the used-up invite
  });

  it("INV-7: an invite whose group is gone is not found", async () => {
    await db.query("delete from groups where id = $1", [groupId]);
    await expect(previewInvite(db, "carol", token)).rejects.toBeInstanceOf(NotFoundError);
    await expect(joinWithInvite(db, "carol", token)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("joining (INV-8, INV-9)", () => {
  it("INV-8: adds the caller as a member and uses one use", async () => {
    expect(await joinWithInvite(db, "carol", token)).toEqual({ groupId, groupName: "Sorority", joined: true });
    expect(await requireMember(db, "carol", groupId)).toBe("member");
    expect(await useCount()).toBe(1);
  });

  it("INV-8: the cap holds, and the next join is not found and adds nobody", async () => {
    const small = await createInvite(db, "alice", groupId, { maxUses: 2 });
    await joinWithInvite(db, "carol", small.token);
    await joinWithInvite(db, "dee", small.token);
    await expect(joinWithInvite(db, "erin", small.token)).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireMember(db, "erin", groupId)).rejects.toBeInstanceOf(NotFoundError);
    const rows = await db.query<{ use_count: number }>("select use_count from group_invites where id = $1", [small.id]);
    expect(rows[0].use_count).toBe(2);
  });

  it("INV-8: two joins for the last use admit exactly one", async () => {
    // PGlite runs one query at a time, so this pins the statement's behavior, not Postgres row locking.
    // The real concurrency check is in neon.integration.test.ts.
    const last = await createInvite(db, "alice", groupId, { maxUses: 1 });
    const results = await Promise.allSettled([joinWithInvite(db, "carol", last.token), joinWithInvite(db, "dee", last.token)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });

  it("INV-8: joining the same group again with a different invite still works for a new person", async () => {
    const other = await createInvite(db, "alice", groupId);
    await joinWithInvite(db, "carol", token);
    await joinWithInvite(db, "dee", other.token);
    expect(await memberCount()).toBe(4);
  });

  it("INV-9: an existing member joins as a no-op: no use consumed, role unchanged", async () => {
    expect(await joinWithInvite(db, "bea", token)).toEqual({ groupId, groupName: "Sorority", joined: false });
    expect(await useCount()).toBe(0);
    expect(await requireMember(db, "bea", groupId)).toBe("member");
  });

  it("INV-9: the owner opening their own link stays owner and consumes nothing", async () => {
    expect((await joinWithInvite(db, "alice", token)).joined).toBe(false);
    expect(await requireMember(db, "alice", groupId)).toBe("owner");
    expect(await useCount()).toBe(0);
  });

  it("INV-9: a member joining twice with a usable link consumes nothing the second time", async () => {
    await joinWithInvite(db, "carol", token);
    expect((await joinWithInvite(db, "carol", token)).joined).toBe(false);
    expect(await useCount()).toBe(1);
  });

  it("INV-9: an existing member with a used-up link still gets not found (INV-7)", async () => {
    const small = await createInvite(db, "alice", groupId, { maxUses: 1 });
    await joinWithInvite(db, "carol", small.token);
    await expect(joinWithInvite(db, "bea", small.token)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("group size (INV-10)", () => {
  async function fillTo(n: number) {
    for (let i = (await memberCount()); i < n; i++) await addMember(db, groupId, `filler-${i}`);
  }

  it("INV-10: the 30th member can join", async () => {
    await fillTo(MAX_GROUP_MEMBERS - 1);
    expect((await joinWithInvite(db, "carol", token)).joined).toBe(true);
    expect(await memberCount()).toBe(MAX_GROUP_MEMBERS);
  });

  it("INV-10: a 31st is rejected with GroupFullError, uses no use, and is not added", async () => {
    await fillTo(MAX_GROUP_MEMBERS);
    await expect(joinWithInvite(db, "carol", token)).rejects.toBeInstanceOf(GroupFullError);
    expect(await useCount()).toBe(0);
    await expect(requireMember(db, "carol", groupId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("INV-10: a full group does not count as a failed lookup, and its preview still works", async () => {
    await fillTo(MAX_GROUP_MEMBERS);
    await expect(joinWithInvite(db, "carol", token)).rejects.toBeInstanceOf(GroupFullError);
    expect(await attempts("carol")).toBe(0);
    expect((await previewInvite(db, "carol", token)).memberCount).toBe(MAX_GROUP_MEMBERS);
  });

  it("INV-10: an existing member of a full group is told joined:false, not full", async () => {
    await fillTo(MAX_GROUP_MEMBERS);
    expect((await joinWithInvite(db, "bea", token)).joined).toBe(false);
  });
});

describe("rate limiting (INV-11)", () => {
  const fail = (i: number) =>
    (i % 2 ? previewInvite(db, "zed", WELL_FORMED_UNKNOWN) : joinWithInvite(db, "zed", "nope")).catch((e) => e);

  it("INV-11: ten failures are allowed, then even a valid token is refused", async () => {
    for (let i = 0; i < MAX_FAILED_LOOKUPS; i++) expect(await fail(i)).toBeInstanceOf(NotFoundError);
    await expect(previewInvite(db, "zed", token)).rejects.toBeInstanceOf(RateLimitedError);
    await expect(joinWithInvite(db, "zed", token)).rejects.toBeInstanceOf(RateLimitedError);
    await expect(requireMember(db, "zed", groupId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("INV-11: blocked calls are not counted", async () => {
    for (let i = 0; i < MAX_FAILED_LOOKUPS; i++) await fail(i);
    await previewInvite(db, "zed", token).catch(() => {});
    await previewInvite(db, "zed", token).catch(() => {});
    expect(await attempts("zed")).toBe(MAX_FAILED_LOOKUPS);
  });

  it("INV-11: successful lookups never count", async () => {
    for (let i = 0; i < MAX_FAILED_LOOKUPS + 5; i++) await previewInvite(db, "carol", token);
    expect(await attempts("carol")).toBe(0);
    await expect(previewInvite(db, "carol", token)).resolves.toBeDefined();
  });

  it("INV-11: failures older than an hour stop counting", async () => {
    for (let i = 0; i < MAX_FAILED_LOOKUPS; i++) await fail(i);
    await db.query("update invite_attempts set at = now() - interval '61 minutes' where user_id = 'zed'");
    await expect(previewInvite(db, "zed", token)).resolves.toBeDefined();
  });

  it("INV-11: one user's failures never block another", async () => {
    for (let i = 0; i < MAX_FAILED_LOOKUPS; i++) await fail(i);
    await expect(previewInvite(db, "carol", token)).resolves.toBeDefined();
  });

  it("INV-11: a malformed token counts as a failure, like an unknown one", async () => {
    await previewInvite(db, "zed", "x").catch(() => {});
    expect(await attempts("zed")).toBe(1);
  });
});
