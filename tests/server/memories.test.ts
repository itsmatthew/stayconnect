import { beforeEach, describe, expect, it } from "vitest";
import { createGroup } from "../../src/server/groups";
import {
  deleteMemory,
  getMemory,
  listInbox,
  listSent,
  replyToMemory,
  sendMemory,
} from "../../src/server/memories";
import { NoRecipientsError, NotFoundError } from "../../src/server/errors";
import type { Db } from "../../src/server/db";
import { addMember, newTestDb, removeMember } from "./helpers";
import type { PGlite } from "@electric-sql/pglite";

let db: Db;
let pg: PGlite;
let groupId: string;

// alice owns the group; bea and cy are members; mallory is a user who is in no group.
beforeEach(async () => {
  ({ db, pg } = await newTestDb());
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
  await addMember(db, groupId, "cy");
  await db.query("insert into users (id) values ('mallory')");
});

const send = (userId = "alice", caption = "Remember this?") => sendMemory(db, userId, { groupId, caption });

describe("sending (BE-3 to BE-6)", () => {
  it("BE-4: every other member receives it and the sender does not", async () => {
    await send();
    expect(await listInbox(db, "bea")).toHaveLength(1);
    expect(await listInbox(db, "cy")).toHaveLength(1);
    expect(await listInbox(db, "alice")).toHaveLength(0);
  });

  it("BE-3: a non-member cannot send, and nothing is stored", async () => {
    await expect(sendMemory(db, "mallory", { groupId, caption: "hi" })).rejects.toBeInstanceOf(NotFoundError);
    const rows = await db.query<{ count: string }>("select count(*)::text as count from memories");
    expect(rows[0].count).toBe("0");
  });

  it("BE-4: a group with no other member is rejected and nothing is stored", async () => {
    const solo = await createGroup(db, "dee", "Just me");
    await expect(sendMemory(db, "dee", { groupId: solo.id, caption: "hi" })).rejects.toBeInstanceOf(NoRecipientsError);
    const rows = await db.query<{ count: string }>("select count(*)::text as count from memories");
    expect(rows[0].count).toBe("0");
  });

  it("BE-5: if storing recipients fails, the memory is not stored either", async () => {
    // Break the recipients table so the second half of the write fails.
    await pg.exec("alter table memory_recipients rename to memory_recipients_gone");
    await expect(send()).rejects.toThrow();
    const rows = await db.query<{ count: string }>("select count(*)::text as count from memories");
    expect(rows[0].count).toBe("0");
  });

  it("BE-15: rejects a caption over 500 characters and stores nothing", async () => {
    await expect(send("alice", "x".repeat(501))).rejects.toThrow();
    await expect(send("alice", "x".repeat(500))).resolves.toBeDefined();
    const rows = await db.query<{ count: string }>("select count(*)::text as count from memories");
    expect(rows[0].count).toBe("1");
  });

  it("BE-6: expires 60 days after it is sent", async () => {
    const { id } = await send();
    const rows = await db.query<{ days: number }>(
      "select extract(day from expires_at - created_at)::int as days from memories where id = $1",
      [id],
    );
    expect(rows[0].days).toBe(60);
  });

  it("BE-6: an expired memory is returned to no one", async () => {
    const { id } = await send();
    await replyToMemory(db, "bea", id);
    await db.query("update memories set expires_at = now() - interval '1 second' where id = $1", [id]);
    expect(await listInbox(db, "bea")).toHaveLength(0);
    expect(await listSent(db, "alice")).toHaveLength(0);
    await expect(getMemory(db, "bea", id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("reading (BE-7 to BE-9)", () => {
  it("BE-7: the inbox is newest first", async () => {
    const first = await send("alice", "one");
    const second = await send("alice", "two");
    await db.query("update memories set created_at = now() - interval '1 hour' where id = $1", [first.id]);
    const inbox = await listInbox(db, "bea");
    expect(inbox.map((m) => m.id)).toEqual([second.id, first.id]);
    expect(inbox[0]).toMatchObject({ caption: "two", senderId: "alice", groupId, replied: false });
  });

  it("BE-8: the sender sees nothing until a recipient replies", async () => {
    const { id } = await send();
    expect(await listSent(db, "alice")).toEqual([]);
    await replyToMemory(db, "bea", id);
    const sent = await listSent(db, "alice");
    expect(sent).toHaveLength(1);
    expect(sent[0].replies.map((r) => r.userId)).toEqual(["bea"]);
  });

  it("BE-8: a recipient's own sent list does not include memories sent by others", async () => {
    const { id } = await send();
    await replyToMemory(db, "bea", id);
    expect(await listSent(db, "bea")).toEqual([]);
  });

  it("BE-9: a recipient can get it; the sender only after a reply", async () => {
    const { id } = await send();
    expect(await getMemory(db, "bea", id)).toMatchObject({ id, caption: "Remember this?" });
    await expect(getMemory(db, "alice", id)).rejects.toBeInstanceOf(NotFoundError);
    await replyToMemory(db, "cy", id);
    expect(await getMemory(db, "alice", id)).toMatchObject({ id });
  });

  it("BE-9: an outsider and an unknown id get the same error", async () => {
    const { id } = await send();
    const outsider = await getMemory(db, "mallory", id).catch((e) => e);
    const unknown = await getMemory(db, "mallory", "00000000-0000-0000-0000-000000000000").catch((e) => e);
    const malformed = await getMemory(db, "mallory", "nope").catch((e) => e);
    for (const err of [outsider, unknown, malformed]) expect(err).toBeInstanceOf(NotFoundError);
    expect(outsider.message).toBe(unknown.message);
  });
});

describe("replying and deleting (BE-10 to BE-12)", () => {
  it("BE-10: the sender and outsiders cannot reply", async () => {
    const { id } = await send();
    await expect(replyToMemory(db, "alice", id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(replyToMemory(db, "mallory", id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await listSent(db, "alice")).toEqual([]);
  });

  it("BE-11: replying twice changes nothing", async () => {
    const { id } = await send();
    await replyToMemory(db, "bea", id);
    await replyToMemory(db, "bea", id);
    const sent = await listSent(db, "alice");
    expect(sent[0].replies).toHaveLength(1);
  });

  it("BE-12: only the sender can delete; it disappears for everyone", async () => {
    const { id } = await send();
    await replyToMemory(db, "bea", id);
    await expect(deleteMemory(db, "bea", id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteMemory(db, "mallory", id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await listInbox(db, "cy")).toHaveLength(1);

    await deleteMemory(db, "alice", id);
    expect(await listInbox(db, "bea")).toHaveLength(0);
    expect(await listInbox(db, "cy")).toHaveLength(0);
    expect(await listSent(db, "alice")).toHaveLength(0);
    await expect(getMemory(db, "bea", id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("membership change (BE-13)", () => {
  it("BE-13: a removed member loses inbox, get, and reply access", async () => {
    const { id } = await send();
    await removeMember(db, groupId, "bea");
    expect(await listInbox(db, "bea")).toHaveLength(0);
    await expect(getMemory(db, "bea", id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(replyToMemory(db, "bea", id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("BE-13: remaining recipients keep it", async () => {
    const { id } = await send();
    await removeMember(db, groupId, "bea");
    expect(await listInbox(db, "cy")).toHaveLength(1);
    expect(await getMemory(db, "cy", id)).toMatchObject({ id });
  });

  it("BE-13: a removed member's earlier reply does not unseal the memory for the sender", async () => {
    const { id } = await send();
    await replyToMemory(db, "bea", id);
    await removeMember(db, groupId, "bea");
    expect(await listSent(db, "alice")).toEqual([]);
  });
});
