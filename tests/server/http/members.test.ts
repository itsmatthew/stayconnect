import { beforeEach, describe, expect, it } from "vitest";
import { removeMemberHandler } from "../../../src/server/http/members";
import type { Deps } from "../../../src/server/http/kit";
import type { Db } from "../../../src/server/db";
import { createGroup, requireMember } from "../../../src/server/groups";
import { addMember, newTestDb } from "../helpers";

let db: Db;
let user: string | null;
let deps: Deps;
let groupId: string;

// alice owns the group; bea and cy are members; mallory is signed in but in no group.
beforeEach(async () => {
  ({ db } = await newTestDb());
  user = "alice";
  deps = { db, getUserId: async () => user };
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
  await addMember(db, groupId, "cy");
  await db.query("insert into users (id) values ('mallory')");
});

const NO_SUCH = "00000000-0000-4000-8000-000000000000";
const remove = (target: string, headers: Record<string, string> = {}, gid = groupId, body?: string) =>
  removeMemberHandler(
    new Request(`https://app.test/api/groups/${gid}/members/${encodeURIComponent(target)}`, { method: "DELETE", headers, body }),
    gid,
    target,
    deps,
  );
const isMember = (u: string) => requireMember(db, u, groupId).then(() => true, () => false);
const memberCount = async () => Number((await db.query<{ n: string }>("select count(*) n from group_members where group_id = $1", [groupId]))[0].n);

describe("DELETE /api/groups/[id]/members/[userId] (API-22)", () => {
  it("the owner removes a member: 200 { removed: true }", async () => {
    const res = await remove("bea");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ removed: true });
    expect(await isMember("bea")).toBe(false);
    expect(await isMember("cy")).toBe(true);
  });

  it("a member leaves: 200", async () => {
    user = "bea";
    expect((await remove("bea")).status).toBe(200);
    expect(await isMember("bea")).toBe(false);
  });

  it("a plain member removing someone else gets 404, and nothing changes", async () => {
    user = "bea";
    const res = await remove("cy");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect(await memberCount()).toBe(3);
  });

  it("a non-member, an unknown group, a malformed group id, and an unknown target are the identical 404", async () => {
    const answers: Response[] = [];
    user = "mallory"; answers.push(await remove("bea"));
    user = "alice";
    answers.push(await remove("bea", {}, NO_SUCH), await remove("bea", {}, "not-a-uuid"), await remove("nobody"));
    for (const res of answers) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    }
    expect(await memberCount()).toBe(3);
  });

  it("the only owner gets 409 last_owner, and stays", async () => {
    const res = await remove("alice");
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "last_owner" });
    expect(await requireMember(db, "alice", groupId)).toBe("owner");
  });

  it("a target id that is empty or over 255 characters is 400, and nothing changes", async () => {
    for (const bad of ["", "x".repeat(256)]) {
      const res = await remove(bad);
      expect(res.status, String(bad.length)).toBe(400);
      expect((await res.json()).error).toBe("invalid_request");
    }
    expect(await memberCount()).toBe(3);
  });

  it("a target id with characters that need escaping is just an unknown member (404)", async () => {
    expect((await remove("a/b ?c=d%20")).status).toBe(404);
  });

  it("401 when signed out, 403 cross-origin, 415 for a non-JSON body; nothing changes", async () => {
    user = null;
    expect((await remove("bea")).status).toBe(401);
    user = "alice";
    expect((await remove("bea", { origin: "https://evil.test" })).status).toBe(403);
    expect((await remove("bea", { "content-type": "text/plain" }, groupId, "hi")).status).toBe(415);
    expect(await memberCount()).toBe(3);
  });

  it("responses are private, no-store, success and failure", async () => {
    for (const res of [await remove("bea"), await remove("bea"), await remove("alice"), await remove("")]) {
      expect(res.headers.get("cache-control")).toBe("private, no-store");
    }
  });
});
