import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGroup } from "../../../src/server/groups";
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
