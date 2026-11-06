import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteMemoryHandler,
  getMemoryHandler,
  inboxHandler,
  replyHandler,
  sendMemoryHandler,
  sentHandler,
} from "../../../src/server/http/memories";
import type { Deps } from "../../../src/server/http/kit";
import type { Db } from "../../../src/server/db";
import { createGroup } from "../../../src/server/groups";
import { addMember, newTestDb, removeMember } from "../helpers";

let db: Db;
let user: string | null;
let deps: Deps;
let groupId: string;

// alice owns the group; bea and cy are members; mallory is in no group.
beforeEach(async () => {
  ({ db } = await newTestDb());
  user = "alice";
  deps = { db, getUserId: async () => user };
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
  await addMember(db, groupId, "cy");
  await db.query("insert into users (id) values ('mallory')");
});

const base = "https://app.test/api/memories";
const as = (u: string | null) => { user = u; };
const send = async (caption = "Remember this?") =>
  (await (await sendMemoryHandler(
    new Request(base, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ groupId, caption }) }),
    deps,
  )).json()).id as string;
const reply = (id: string, headers: Record<string, string> = {}) =>
  replyHandler(new Request(`${base}/${id}/reply`, { method: "POST", headers }), id, deps);
const sent = () => sentHandler(new Request(`${base}/sent`), deps);
const inbox = () => inboxHandler(new Request(`${base}/inbox`), deps);
const read = (id: string) => getMemoryHandler(new Request(`${base}/${id}`), id, deps);
const del = (id: string, headers: Record<string, string> = {}) =>
  deleteMemoryHandler(new Request(`${base}/${id}`, { method: "DELETE", headers }), id, deps);
const count = async (table: string) => Number((await db.query<{ n: string }>(`select count(*) n from ${table}`))[0].n);
const NO_SUCH = "00000000-0000-4000-8000-000000000000";

describe("POST /api/memories/[id]/reply (API-13)", () => {
  it("a recipient replies: 200 { replied: true }, and the inbox shows replied", async () => {
    const id = await send();
    as("bea");
    const res = await reply(id);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ replied: true });
    expect((await (await inbox()).json()).memories[0].replied).toBe(true);
  });

  it("replying twice is 200 both times and stores one reply (BE-11)", async () => {
    const id = await send();
    as("bea");
    expect((await reply(id)).status).toBe(200);
    expect((await reply(id)).status).toBe(200);
    expect(await count("memory_replies")).toBe(1);
  });

  it("the reply is recorded for the session user", async () => {
    const id = await send();
    as("bea");
    await reply(id);
    expect(await db.query("select user_id from memory_replies")).toEqual([{ user_id: "bea" }]);
  });

  it("the sender, a stranger, an unknown id, and a malformed id all get the identical 404, and nothing is stored", async () => {
    const id = await send();
    const answers: Response[] = [];
    as("alice"); answers.push(await reply(id));
    as("mallory"); answers.push(await reply(id));
    as("bea"); answers.push(await reply(NO_SUCH), await reply("not-a-uuid"), await reply("1; drop table memories"));
    for (const res of answers) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    }
    expect(await count("memory_replies")).toBe(0);
  });

  it("a member who left gets 404 (BE-13)", async () => {
    const id = await send();
    await removeMember(db, groupId, "bea");
    as("bea");
    expect((await reply(id)).status).toBe(404);
    expect(await count("memory_replies")).toBe(0);
  });

  it("a deleted memory gets 404", async () => {
    const id = await send();
    await del(id);
    as("bea");
    expect((await reply(id)).status).toBe(404);
  });

  it("401 when signed out, and nothing is stored", async () => {
    const id = await send();
    as(null);
    expect((await reply(id)).status).toBe(401);
    expect(await count("memory_replies")).toBe(0);
  });

  it("403 for a cross-origin POST, and nothing is stored", async () => {
    const id = await send();
    as("bea");
    expect((await reply(id, { origin: "https://evil.test" })).status).toBe(403);
    expect(await count("memory_replies")).toBe(0);
  });

  it("a reply unseals the memory for the sender (sealed behavior over HTTP)", async () => {
    const id = await send();
    expect((await read(id)).status).toBe(404);
    as("bea");
    await reply(id);
    as("alice");
    expect((await read(id)).status).toBe(200);
  });
});

describe("GET /api/memories/sent (API-14)", () => {
  it("an unreplied memory is absent, not hidden", async () => {
    await send();
    const res = await sent();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ memories: [] });
  });

  it("after a reply it is listed with who replied", async () => {
    const id = await send("Remember this?");
    as("bea");
    await reply(id);
    as("alice");
    expect(await (await sent()).json()).toEqual({
      memories: [
        {
          id,
          groupId,
          senderId: "alice",
          caption: "Remember this?",
          createdAt: expect.any(String),
          replies: [{ userId: "bea", createdAt: expect.any(String) }],
        },
      ],
    });
  });

  it("lists every replier, and newest memory first", async () => {
    const first = await send("first");
    const second = await send("second");
    for (const u of ["bea", "cy"]) { as(u); await reply(first); }
    as("bea"); await reply(second);
    as("alice");
    const { memories } = await (await sent()).json();
    expect(memories.map((m: { caption: string }) => m.caption)).toEqual(["second", "first"]);
    expect(memories[1].replies.map((r: { userId: string }) => r.userId).sort()).toEqual(["bea", "cy"]);
  });

  it("only the caller's own sends are listed", async () => {
    const id = await send();
    as("bea");
    await reply(id);
    expect(await (await sent()).json()).toEqual({ memories: [] }); // bea sent nothing
  });

  it("a reply from someone who left the group does not unseal it", async () => {
    const id = await send();
    as("bea");
    await reply(id);
    await removeMember(db, groupId, "bea");
    as("alice");
    expect(await (await sent()).json()).toEqual({ memories: [] });
  });

  it("a deleted memory is not listed", async () => {
    const id = await send();
    as("bea");
    await reply(id);
    as("alice");
    await del(id);
    expect(await (await sent()).json()).toEqual({ memories: [] });
  });

  it("401 when signed out", async () => {
    as(null);
    expect((await sent()).status).toBe(401);
  });
});

describe("DELETE /api/memories/[id] (API-15)", () => {
  it("the sender deletes: 200 { deleted: true }, and it is gone for everyone", async () => {
    const id = await send();
    as("bea");
    await reply(id);
    as("alice");
    const res = await del(id);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect((await read(id)).status).toBe(404);
    expect(await (await sent()).json()).toEqual({ memories: [] });
    for (const u of ["bea", "cy"]) {
      as(u);
      expect(await (await inbox()).json()).toEqual({ memories: [] });
      expect((await read(id)).status).toBe(404);
    }
  });

  it("a recipient cannot delete: 404, and the memory is unchanged", async () => {
    const id = await send();
    as("bea");
    const res = await del(id);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect((await read(id)).status).toBe(200);
    expect(await count("memories")).toBe(1);
  });

  it("a stranger, an unknown id, and a malformed id get the identical 404", async () => {
    const id = await send();
    const answers: Response[] = [];
    as("mallory"); answers.push(await del(id));
    as("alice"); answers.push(await del(NO_SUCH), await del("not-a-uuid"));
    for (const res of answers) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    }
    as("bea");
    expect((await read(id)).status).toBe(200);
  });

  it("deleting twice: the second is 404", async () => {
    const id = await send();
    expect((await del(id)).status).toBe(200);
    expect((await del(id)).status).toBe(404);
  });

  it("a sender who left the group can still delete (BE-13)", async () => {
    const id = await send();
    await removeMember(db, groupId, "alice");
    expect((await del(id)).status).toBe(200);
    as("bea");
    expect((await read(id)).status).toBe(404);
  });

  it("401 when signed out, and the memory stays", async () => {
    const id = await send();
    as(null);
    expect((await del(id)).status).toBe(401);
    as("bea");
    expect((await read(id)).status).toBe(200);
  });

  it("403 for a cross-origin DELETE, and the memory stays", async () => {
    const id = await send();
    expect((await del(id, { origin: "https://evil.test" })).status).toBe(403);
    as("bea");
    expect((await read(id)).status).toBe(200);
  });
});

describe("responses are private, no-store (API-7)", () => {
  it("reply, sent, delete, success and failure", async () => {
    const id = await send();
    as("bea");
    const all = [await reply(id), await reply("nope"), await sent(), await del(id), await del("nope")];
    for (const res of all) expect(res.headers.get("cache-control")).toBe("private, no-store");
  });
});
