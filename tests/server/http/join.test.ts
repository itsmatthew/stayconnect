import { beforeEach, describe, expect, it, vi } from "vitest";
import { inviteInfoHandler, joinInviteHandler } from "../../../src/server/http/join";
import type { Deps } from "../../../src/server/http/kit";
import type { Db } from "../../../src/server/db";
import { createGroup } from "../../../src/server/groups";
import { createInvite, MAX_FAILED_LOOKUPS, MAX_GROUP_MEMBERS, revokeInvite } from "../../../src/server/invites";
import { addMember, newTestDb } from "../helpers";

let db: Db;
let user: string | null;
let deps: Deps;
let groupId: string;
let token: string;
let inviteId: string;

// alice owns the group; bea is a member; carol is signed in but in no group.
beforeEach(async () => {
  ({ db } = await newTestDb());
  user = "carol";
  deps = { db, getUserId: async () => user };
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
  ({ id: inviteId, token } = await createInvite(db, "alice", groupId));
});

const base = "https://app.test/api/invites";
const info = (t: string) => inviteInfoHandler(new Request(`${base}/${t}`), t, deps);
const join = (t: string, headers: Record<string, string> = {}, body?: string) =>
  joinInviteHandler(new Request(`${base}/${t}/join`, { method: "POST", headers, body }), t, deps);
const count = async (sql: string, params: unknown[] = []) => Number((await db.query<{ n: string }>(sql, params))[0].n);
const members = () => count("select count(*) n from group_members where group_id = $1", [groupId]);
const attempts = () => count("select count(*) n from invite_attempts");
const WELL_FORMED_UNKNOWN = "A".repeat(43);

describe("GET /api/invites/[token] (API-19)", () => {
  it("200 with the group, inviter, size, and membership; nothing changes", async () => {
    const res = await info(token);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ groupName: "Sorority", inviterId: "alice", memberCount: 2, alreadyMember: false });
    expect(await members()).toBe(2);
    expect(await count("select use_count n from group_invites where id = $1", [inviteId])).toBe(0);
  });

  it("alreadyMember is true for a current member", async () => {
    user = "bea";
    expect((await (await info(token)).json()).alreadyMember).toBe(true);
  });

  it("every bad token is the identical 404", async () => {
    const expired = await createInvite(db, "alice", groupId);
    await db.query("update group_invites set expires_at = now() - interval '1 minute' where id = $1", [expired.id]);
    const revoked = await createInvite(db, "alice", groupId);
    await revokeInvite(db, "alice", groupId, revoked.id);
    const usedUp = await createInvite(db, "alice", groupId, { maxUses: 1 });
    user = "dee";
    await join(usedUp.token);
    const bad = ["", "abc", "A".repeat(500), "1;drop table group_invites", WELL_FORMED_UNKNOWN, expired.token, revoked.token, usedUp.token];
    for (const [i, t] of bad.entries()) {
      user = `probe${i}`; // a fresh user each time so the rate limit does not interfere
      const res = await info(t || "x");
      expect(res.status, t).toBe(404);
      expect(await res.json(), t).toEqual({ error: "not_found" });
    }
  });

  it("401 when signed out, and the failed lookup is not counted", async () => {
    user = null;
    expect((await info(WELL_FORMED_UNKNOWN)).status).toBe(401);
    expect(await attempts()).toBe(0);
  });

  it("GET is not origin-checked", async () => {
    const res = await inviteInfoHandler(new Request(`${base}/${token}`, { headers: { origin: "https://evil.test" } }), token, deps);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/invites/[token]/join (API-20)", () => {
  it("200 joined:true, and the caller is now a member", async () => {
    const res = await join(token);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ groupId, groupName: "Sorority", joined: true });
    expect(await members()).toBe(3);
    expect(await db.query("select role from group_members where user_id = 'carol'")).toEqual([{ role: "member" }]);
  });

  it("the member is the session user, whatever the body says", async () => {
    await join(token, { "content-type": "application/json" }, JSON.stringify({ userId: "mallory", role: "owner" }));
    expect(await db.query("select user_id, role from group_members where user_id <> 'alice' and user_id <> 'bea'")).toEqual([
      { user_id: "carol", role: "member" },
    ]);
  });

  it("an existing member gets 200 joined:false and uses nothing", async () => {
    user = "bea";
    const res = await join(token);
    expect(res.status).toBe(200);
    expect((await res.json()).joined).toBe(false);
    expect(await count("select use_count n from group_invites where id = $1", [inviteId])).toBe(0);
  });

  it("every bad token is the identical 404, and nobody is added", async () => {
    const before = await members();
    for (const [i, t] of ["abc", WELL_FORMED_UNKNOWN, "A".repeat(500)].entries()) {
      user = `probe${i}`;
      const res = await join(t);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    }
    expect(await members()).toBe(before);
  });

  it("a used-up invite is 404 for the next person", async () => {
    const one = await createInvite(db, "alice", groupId, { maxUses: 1 });
    await join(one.token);
    user = "dee";
    expect((await join(one.token)).status).toBe(404);
    expect(await count("select count(*) n from group_members where user_id = 'dee'")).toBe(0);
  });

  it("409 group_full when the group is at its limit, and nobody is added", async () => {
    for (let i = await members(); i < MAX_GROUP_MEMBERS; i++) await addMember(db, groupId, `filler-${i}`);
    const res = await join(token);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "group_full" });
    expect(await members()).toBe(MAX_GROUP_MEMBERS);
  });

  it("401 when signed out, and nothing is stored", async () => {
    user = null;
    expect((await join(token)).status).toBe(401);
    expect(await members()).toBe(2);
  });

  it("403 for a cross-origin POST, and nobody is added", async () => {
    expect((await join(token, { origin: "https://evil.test" })).status).toBe(403);
    expect(await members()).toBe(2);
  });

  it("415 for a body that is not JSON", async () => {
    expect((await join(token, { "content-type": "text/plain" }, "hello")).status).toBe(415);
    expect(await members()).toBe(2);
  });
});

describe("rate limiting over HTTP (API-20, INV-11)", () => {
  const hammer = async () => {
    for (let i = 0; i < MAX_FAILED_LOOKUPS; i++) expect((await info(`bad${i}`)).status).toBe(404);
  };

  it("429 rate_limited after ten failures, even for a valid token, on both endpoints", async () => {
    user = "zed";
    await hammer();
    for (const res of [await info(token), await join(token)]) {
      expect(res.status).toBe(429);
      expect(await res.json()).toEqual({ error: "rate_limited" });
      expect(res.headers.get("cache-control")).toBe("private, no-store");
    }
    expect(await count("select count(*) n from group_members where user_id = 'zed'")).toBe(0);
  });

  it("another user is unaffected", async () => {
    user = "zed";
    await hammer();
    user = "carol";
    expect((await info(token)).status).toBe(200);
  });
});

describe("the token never leaks (API-21)", () => {
  it("no response body contains the token, whatever the outcome", async () => {
    const bodies: string[] = [];
    bodies.push(await (await info(token)).text(), await (await join(token)).text(), await (await join(token)).text());
    user = "bea";
    bodies.push(await (await info(token)).text());
    const bad = `${token.slice(0, 40)}xyz`; // looks like a token, isn't
    user = "mallory";
    bodies.push(await (await info(bad)).text(), await (await join(bad)).text());
    for (const body of bodies) {
      expect(body).not.toContain(token);
      expect(body).not.toContain(bad);
    }
  });

  it("an unexpected error logs only the error, not the token", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    deps = { ...deps, db: { query: async () => { throw new Error("connection refused"); } } };
    const res = await join(token);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal" });
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).toContain("connection refused");
    expect(logged).not.toContain(token);
    log.mockRestore();
  });

  it("responses are private, no-store, including errors", async () => {
    for (const res of [await info(token), await join(token), await info("nope"), await join("nope")]) {
      expect(res.headers.get("cache-control")).toBe("private, no-store");
    }
  });
});
