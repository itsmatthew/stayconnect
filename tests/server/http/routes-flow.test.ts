import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGroup } from "../../../src/server/groups";
import { createInvite } from "../../../src/server/invites";
import { addMember, newTestDb } from "../helpers";
import type { Deps } from "../../../src/server/http/kit";

// The real route files, with only the session and database faked: proves each method is wired to the right handler.
let current: Deps;
vi.mock("../../../src/app/api/deps", () => ({ deps: () => current }));

let user: string;
let groupId: string;
beforeEach(async () => {
  const { db } = await newTestDb();
  user = "alice";
  current = { db, getUserId: async () => user };
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
});

const url = (path: string) => `http://localhost/api/memories${path}`;
const json = (method: string, path: string, body?: unknown) =>
  new Request(url(path), { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("memory routes, end to end (API-10 to API-15)", () => {
  it("send, inbox, sealed, reply, unsealed, sent, delete", async () => {
    const { POST: send } = await import("../../../src/app/api/memories/route");
    const { GET: inbox } = await import("../../../src/app/api/memories/inbox/route");
    const { GET: sentList } = await import("../../../src/app/api/memories/sent/route");
    const { GET: one, DELETE: remove } = await import("../../../src/app/api/memories/[id]/route");
    const { POST: reply } = await import("../../../src/app/api/memories/[id]/reply/route");

    const created = await send(json("POST", "", { groupId, caption: "hello" }));
    expect(created.status).toBe(201);
    const { id } = await created.json();

    expect((await one(json("GET", `/${id}`), idCtx(id))).status).toBe(404); // sealed for the sender
    user = "bea";
    expect((await (await inbox(json("GET", "/inbox"))).json()).memories).toHaveLength(1);
    expect((await one(json("GET", `/${id}`), idCtx(id))).status).toBe(200);
    expect((await remove(json("DELETE", `/${id}`), idCtx(id))).status).toBe(404); // a recipient can't delete
    expect((await reply(json("POST", `/${id}/reply`), idCtx(id))).status).toBe(200);

    user = "alice";
    expect((await one(json("GET", `/${id}`), idCtx(id))).status).toBe(200); // unsealed
    expect((await (await sentList(json("GET", "/sent"))).json()).memories).toHaveLength(1);
    expect((await remove(json("DELETE", `/${id}`), idCtx(id))).status).toBe(200);

    user = "bea";
    expect((await one(json("GET", `/${id}`), idCtx(id))).status).toBe(404);
  });
});

describe("invite routes, end to end (API-19, API-20)", () => {
  it("a friend previews, joins, and then receives what the owner sends", async () => {
    const { GET: info } = await import("../../../src/app/api/invites/[token]/route");
    const { POST: join } = await import("../../../src/app/api/invites/[token]/join/route");
    const { POST: send } = await import("../../../src/app/api/memories/route");
    const { GET: inbox } = await import("../../../src/app/api/memories/inbox/route");
    const { token } = await createInvite(current.db, "alice", groupId);
    const ctx = { params: Promise.resolve({ token }) };

    user = "carol";
    const preview = await info(new Request(url("").replace("/memories", `/invites/${token}`)), ctx);
    expect(await preview.json()).toMatchObject({ groupName: "Sorority", alreadyMember: false });
    const joined = await join(new Request(url("").replace("/memories", `/invites/${token}/join`), { method: "POST" }), ctx);
    expect(await joined.json()).toMatchObject({ groupId, joined: true });

    user = "alice";
    expect((await send(json("POST", "", { groupId, caption: "welcome" }))).status).toBe(201);
    user = "carol";
    expect((await (await inbox(json("GET", "/inbox"))).json()).memories[0].caption).toBe("welcome");
  });
});

describe("owner invite routes, end to end (API-16 to API-18)", () => {
  it("owner makes a link, a friend joins with it, the owner sees the use and revokes, and the next friend is turned away", async () => {
    const { POST: createInvite, GET: listInvites } = await import("../../../src/app/api/groups/[id]/invites/route");
    const { DELETE: revokeInvite } = await import("../../../src/app/api/groups/[id]/invites/[inviteId]/route");
    const { POST: join } = await import("../../../src/app/api/invites/[token]/join/route");
    const gurl = (rest = "") => `http://localhost/api/groups/${groupId}/invites${rest}`;
    const gctx = { params: Promise.resolve({ id: groupId }) };

    user = "alice";
    const created = await createInvite(new Request(gurl(), { method: "POST" }), gctx);
    expect(created.status).toBe(201);
    const { id, token } = await created.json();

    user = "carol";
    const tctx = { params: Promise.resolve({ token }) };
    const joined = await join(new Request(`http://localhost/api/invites/${token}/join`, { method: "POST" }), tctx);
    expect(await joined.json()).toMatchObject({ groupId, joined: true });

    user = "alice";
    const listed = await (await listInvites(new Request(gurl()), gctx)).json();
    expect(listed.invites).toMatchObject([{ id, useCount: 1 }]);
    const revoked = await revokeInvite(new Request(gurl(`/${id}`), { method: "DELETE" }), { params: Promise.resolve({ id: groupId, inviteId: id }) });
    expect(await revoked.json()).toEqual({ revoked: true });

    user = "dee";
    expect((await join(new Request(`http://localhost/api/invites/${token}/join`, { method: "POST" }), tctx)).status).toBe(404);
  });
});

describe("member route, end to end (API-22)", () => {
  it("a member leaves through the route and the inbox is empty afterwards; the last owner cannot leave", async () => {
    const { DELETE: removeMember } = await import("../../../src/app/api/groups/[id]/members/[userId]/route");
    const { POST: send } = await import("../../../src/app/api/memories/route");
    const { GET: inbox } = await import("../../../src/app/api/memories/inbox/route");
    const leave = (who: string) =>
      removeMember(json("DELETE", ""), { params: Promise.resolve({ id: groupId, userId: who }) });

    expect((await send(json("POST", "", { groupId, caption: "hello" }))).status).toBe(201);
    user = "bea";
    expect((await (await inbox(json("GET", "/inbox"))).json()).memories).toHaveLength(1);
    const left = await leave("bea");
    expect(left.status).toBe(200);
    expect(await left.json()).toEqual({ removed: true });
    expect((await (await inbox(json("GET", "/inbox"))).json()).memories).toHaveLength(0);

    user = "alice";
    const blocked = await leave("alice");
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toEqual({ error: "last_owner" });
  });
});
