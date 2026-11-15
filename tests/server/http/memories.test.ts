import { beforeEach, describe, expect, it } from "vitest";
import {
  getMemoryHandler,
  inboxHandler,
  sendMemoryHandler,
} from "../../../src/server/http/memories";
import type { Deps } from "../../../src/server/http/kit";
import type { Db } from "../../../src/server/db";
import { createGroup } from "../../../src/server/groups";
import { replyToMemory } from "../../../src/server/memories";
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
const send = (body: unknown, headers: Record<string, string> = {}) =>
  sendMemoryHandler(
    new Request(base, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    deps,
  );
const inbox = () => inboxHandler(new Request(`${base}/inbox`), deps);
const read = (id: string) => getMemoryHandler(new Request(`${base}/${id}`), id, deps);
/** Sends as alice and returns the new memory id. */
const sendAsAlice = async (caption = "Remember this?") => {
  user = "alice";
  return (await (await send({ groupId, caption })).json()).id as string;
};
const count = async (table: string) => Number((await db.query<{ n: string }>(`select count(*) n from ${table}`))[0].n);

describe("POST /api/memories (API-10)", () => {
  it("201 with the new id, and the other members receive it", async () => {
    const res = await send({ groupId, caption: "Remember this?" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: expect.stringMatching(/^[0-9a-f-]{36}$/) });
    expect(await count("memory_recipients")).toBe(2);
  });

  it("the sender is the session user, even if the body names someone else", async () => {
    await send({ groupId, caption: "hi", senderId: "mallory", sender_id: "mallory" });
    expect(await db.query("select sender_id from memories")).toEqual([{ sender_id: "alice" }]);
  });

  it("an empty caption is allowed", async () => {
    expect((await send({ groupId, caption: "" })).status).toBe(201);
  });

  it("a 500-character caption is allowed, and 500 emoji count as 500 characters", async () => {
    expect((await send({ groupId, caption: "x".repeat(500) })).status).toBe(201);
    expect((await send({ groupId, caption: "😀".repeat(500) })).status).toBe(201);
  });

  it.each([
    ["caption of 501 characters", () => ({ groupId, caption: "x".repeat(501) })],
    ["caption of 501 emoji", () => ({ groupId, caption: "😀".repeat(501) })],
    ["caption not a string", () => ({ groupId, caption: 7 })],
    ["missing caption", () => ({ groupId })],
    ["groupId not a uuid", () => ({ groupId: "not-a-uuid", caption: "hi" })],
    ["groupId not a string", () => ({ groupId: 5, caption: "hi" })],
    ["missing groupId", () => ({ caption: "hi" })],
  ])("400 for %s, and nothing is stored", async (_label, body) => {
    const res = await send(body());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
    expect(await count("memories")).toBe(0);
  });

  it("404 for a group the caller is not in, and nothing is stored", async () => {
    user = "mallory";
    const res = await send({ groupId, caption: "hi" });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect(await count("memories")).toBe(0);
  });

  it("404 for a group that does not exist is the same answer", async () => {
    const a = await send({ groupId: "00000000-0000-4000-8000-000000000000", caption: "hi" });
    user = "mallory";
    const b = await send({ groupId, caption: "hi" });
    expect(a.status).toBe(404);
    expect(await a.json()).toEqual(await b.json());
  });

  it("409 when the group has no other member, and nothing is stored", async () => {
    user = "dee";
    const solo = await createGroup(db, "dee", "Just me");
    const res = await send({ groupId: solo.id, caption: "hi" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "no_recipients" });
    expect(await count("memories")).toBe(0);
  });

  it("a photoKey in the body is ignored and not stored", async () => {
    await send({ groupId, caption: "hi", photoKey: "../../secret.jpg" });
    expect(await db.query("select photo_key from memories")).toEqual([{ photo_key: null }]);
  });

  it("401 when signed out, and nothing is stored", async () => {
    user = null;
    expect((await send({ groupId, caption: "hi" })).status).toBe(401);
    expect(await count("memories")).toBe(0);
  });

  it("403 for a cross-origin POST, 415 for a non-JSON body", async () => {
    expect((await send({ groupId, caption: "hi" }, { origin: "https://evil.test" })).status).toBe(403);
    expect((await send({ groupId, caption: "hi" }, { "content-type": "text/plain" })).status).toBe(415);
    expect(await count("memories")).toBe(0);
  });
});

describe("GET /api/memories/inbox (API-11)", () => {
  it("a recipient sees the memory with replied=false and no photoKey", async () => {
    const id = await sendAsAlice("Remember this?");
    user = "bea";
    const res = await inbox();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      memories: [
        { id, groupId, senderId: "alice", caption: "Remember this?", createdAt: expect.any(String), replied: false },
      ],
    });
  });

  it("replied becomes true after the caller replies", async () => {
    const id = await sendAsAlice();
    await replyToMemory(db, "bea", id);
    user = "bea";
    expect((await (await inbox()).json()).memories[0].replied).toBe(true);
  });

  it("the sender's own sends are not in their inbox", async () => {
    await sendAsAlice();
    expect(await (await inbox()).json()).toEqual({ memories: [] });
  });

  it("newest first", async () => {
    await sendAsAlice("first");
    await sendAsAlice("second");
    user = "bea";
    const { memories } = await (await inbox()).json();
    expect(memories.map((m: { caption: string }) => m.caption)).toEqual(["second", "first"]);
  });

  it("someone outside the group sees nothing", async () => {
    await sendAsAlice();
    user = "mallory";
    expect(await (await inbox()).json()).toEqual({ memories: [] });
  });

  it("a member who left no longer sees it (BE-13)", async () => {
    await sendAsAlice();
    await removeMember(db, groupId, "bea");
    user = "bea";
    expect(await (await inbox()).json()).toEqual({ memories: [] });
  });

  it("401 when signed out", async () => {
    user = null;
    expect((await inbox()).status).toBe(401);
  });
});

describe("GET /api/memories/[id] (API-12)", () => {
  it("a recipient reads it, without photoKey", async () => {
    const id = await sendAsAlice("Remember this?");
    user = "bea";
    const res = await read(id);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id,
      groupId,
      senderId: "alice",
      caption: "Remember this?",
      createdAt: expect.any(String),
    });
  });

  it("the sender gets 404 until a recipient replies (sealed), then can read it", async () => {
    const id = await sendAsAlice();
    expect((await read(id)).status).toBe(404);
    await replyToMemory(db, "bea", id);
    expect((await read(id)).status).toBe(200);
  });

  it("a stranger, an unknown id, a malformed id, and a sealed memory all get the identical 404", async () => {
    const id = await sendAsAlice();
    const answers = [];
    user = "mallory";
    answers.push(await read(id));
    user = "bea";
    answers.push(await read("00000000-0000-4000-8000-000000000000"));
    answers.push(await read("not-a-uuid"));
    answers.push(await read("1; drop table memories"));
    user = "alice";
    answers.push(await read(id)); // sealed
    for (const res of answers) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    }
  });

  it("a member who left gets 404 (BE-13)", async () => {
    const id = await sendAsAlice();
    await removeMember(db, groupId, "bea");
    user = "bea";
    expect((await read(id)).status).toBe(404);
  });

  it("401 when signed out", async () => {
    const id = await sendAsAlice();
    user = null;
    expect((await read(id)).status).toBe(401);
  });
});

describe("shared rules on memory endpoints (API-7)", () => {
  it("responses are private, no-store", async () => {
    const id = await sendAsAlice();
    user = "bea";
    for (const res of [await inbox(), await read(id), await read("nope"), await send({ groupId: "x" })]) {
      expect(res.headers.get("cache-control")).toBe("private, no-store");
    }
  });
});
