import { beforeEach, describe, expect, it } from "vitest";
import { createGroup, requireMember } from "../../src/server/groups";
import { LastOwnerError, NotFoundError } from "../../src/server/errors";
import { removeGroupMember } from "../../src/server/members";
import { deleteMemory, getMemory, listInbox, replyToMemory, sendMemory } from "../../src/server/memories";
import { createInvite, joinWithInvite } from "../../src/server/invites";
import type { Db } from "../../src/server/db";
import { addMember, newTestDb } from "./helpers";

let db: Db;
let groupId: string;

// alice owns the group; bea and cy are members; mallory is in no group; dee owns a different group.
beforeEach(async () => {
  ({ db } = await newTestDb());
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
  await addMember(db, groupId, "cy");
  await db.query("insert into users (id) values ('mallory')");
});

const isMember = (user: string, group = groupId) => requireMember(db, user, group).then(() => true, () => false);
const memberCount = async () => Number((await db.query<{ n: string }>("select count(*) n from group_members where group_id = $1", [groupId]))[0].n);
const NO_SUCH = "00000000-0000-4000-8000-000000000000";

describe("who may remove whom (GM-1, GM-2, GM-3)", () => {
  it("GM-1: the owner removes another member, and only that member", async () => {
    await removeGroupMember(db, "alice", groupId, "bea");
    expect(await isMember("bea")).toBe(false);
    expect(await isMember("cy")).toBe(true);
    expect(await isMember("alice")).toBe(true);
  });

  it("GM-2: a member leaves", async () => {
    await removeGroupMember(db, "bea", groupId, "bea");
    expect(await isMember("bea")).toBe(false);
    expect(await memberCount()).toBe(2);
  });

  it("GM-3: a plain member cannot remove someone else, and nothing changes", async () => {
    await expect(removeGroupMember(db, "bea", groupId, "cy")).rejects.toBeInstanceOf(NotFoundError);
    await expect(removeGroupMember(db, "bea", groupId, "alice")).rejects.toBeInstanceOf(NotFoundError);
    expect(await memberCount()).toBe(3);
  });

  it("GM-3: a non-member, an owner of another group, an unknown group, and a malformed id are all NotFoundError", async () => {
    const dee = await createGroup(db, "dee", "Other");
    const attempts: [string, string, string][] = [
      ["mallory", groupId, "bea"],
      ["dee", groupId, "bea"],
      ["alice", NO_SUCH, "bea"],
      ["alice", "not-a-uuid", "bea"],
      ["dee", dee.id, "bea"], // dee owns this group, but bea is not in it
    ];
    for (const [caller, group, target] of attempts) {
      const err = await removeGroupMember(db, caller, group, target).catch((e) => e);
      expect(err, `${caller}/${group}`).toBeInstanceOf(NotFoundError);
      expect((err as Error).message).toBe("Not found");
    }
    expect(await memberCount()).toBe(3);
  });

  it("GM-3: removing someone who is not in the group is NotFoundError, same as any other", async () => {
    await expect(removeGroupMember(db, "alice", groupId, "nobody")).rejects.toBeInstanceOf(NotFoundError);
    await expect(removeGroupMember(db, "alice", groupId, "mallory")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("GM-3: a sql-looking target is just an unknown member", async () => {
    await expect(removeGroupMember(db, "alice", groupId, "x'; drop table group_members; --")).rejects.toBeInstanceOf(NotFoundError);
    expect(await memberCount()).toBe(3);
  });

  it("GM-3: removing someone twice is NotFoundError the second time", async () => {
    await removeGroupMember(db, "alice", groupId, "bea");
    await expect(removeGroupMember(db, "alice", groupId, "bea")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("the last owner (GM-4)", () => {
  it("GM-4: the only owner cannot leave, and stays an owner", async () => {
    await expect(removeGroupMember(db, "alice", groupId, "alice")).rejects.toBeInstanceOf(LastOwnerError);
    expect(await requireMember(db, "alice", groupId)).toBe("owner");
    expect(await memberCount()).toBe(3);
  });

  it("GM-4: with two owners either may leave, but not the one who is left", async () => {
    await db.query("update group_members set role = 'owner' where group_id = $1 and user_id = 'bea'", [groupId]);
    await removeGroupMember(db, "alice", groupId, "alice");
    expect(await isMember("alice")).toBe(false);
    await expect(removeGroupMember(db, "bea", groupId, "bea")).rejects.toBeInstanceOf(LastOwnerError);
    expect(await requireMember(db, "bea", groupId)).toBe("owner");
  });

  it("GM-4: with two owners one can remove the other, but then cannot remove themself", async () => {
    await db.query("update group_members set role = 'owner' where group_id = $1 and user_id = 'bea'", [groupId]);
    await removeGroupMember(db, "alice", groupId, "bea");
    expect(await isMember("bea")).toBe(false);
    await expect(removeGroupMember(db, "alice", groupId, "alice")).rejects.toBeInstanceOf(LastOwnerError);
  });

  it("GM-4: a plain member still cannot touch the owner (NotFoundError, not LastOwnerError)", async () => {
    await expect(removeGroupMember(db, "bea", groupId, "alice")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("what removal does to access (GM-5, BE-13)", () => {
  async function sendFromAlice(caption = "hi") {
    return (await sendMemory(db, "alice", { groupId, caption })).id;
  }

  it("GM-5: the removed person loses inbox, reading, and replying for memories sent before", async () => {
    const id = await sendFromAlice();
    await removeGroupMember(db, "alice", groupId, "bea");
    expect(await listInbox(db, "bea")).toEqual([]);
    await expect(getMemory(db, "bea", id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(replyToMemory(db, "bea", id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("GM-5: leaving has the same effect as being removed", async () => {
    const id = await sendFromAlice();
    await removeGroupMember(db, "bea", groupId, "bea");
    expect(await listInbox(db, "bea")).toEqual([]);
    await expect(getMemory(db, "bea", id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("GM-5: later memories do not go to them, and the others still get them", async () => {
    await removeGroupMember(db, "alice", groupId, "bea");
    await sendFromAlice("after");
    expect(await listInbox(db, "bea")).toEqual([]);
    expect((await listInbox(db, "cy")).map((m) => m.caption)).toEqual(["after"]);
  });

  it("GM-5: what they sent stays with the others, and they can still delete it", async () => {
    const mine = (await sendMemory(db, "bea", { groupId, caption: "from bea" })).id;
    await removeGroupMember(db, "bea", groupId, "bea");
    expect((await listInbox(db, "cy")).map((m) => m.id)).toContain(mine);
    await deleteMemory(db, "bea", mine);
    expect(await listInbox(db, "cy")).toEqual([]);
  });

  it("known edge: removal is not a ban, a still-valid invite lets them back in", async () => {
    const { token } = await createInvite(db, "alice", groupId);
    await removeGroupMember(db, "alice", groupId, "bea");
    expect((await joinWithInvite(db, "bea", token)).joined).toBe(true);
    expect(await isMember("bea")).toBe(true);
  });
});
