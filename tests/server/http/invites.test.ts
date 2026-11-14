import { beforeEach, describe, expect, it } from "vitest";
import { createInviteHandler, listInvitesHandler, revokeInviteHandler } from "../../../src/server/http/invites";
import type { Deps } from "../../../src/server/http/kit";
import type { Db } from "../../../src/server/db";
import { createGroup, requireMember } from "../../../src/server/groups";
import { createInvite, hashToken, joinWithInvite } from "../../../src/server/invites";
import { NotFoundError } from "../../../src/server/errors";
import { addMember, newTestDb } from "../helpers";

let db: Db;
let user: string | null;
let deps: Deps;
let groupId: string;

// alice owns the group; bea is a member; mallory is signed in but in no group.
beforeEach(async () => {
  ({ db } = await newTestDb());
  user = "alice";
  deps = { db, getUserId: async () => user };
  groupId = (await createGroup(db, "alice", "Sorority")).id;
  await addMember(db, groupId, "bea");
  await db.query("insert into users (id) values ('mallory')");
});

const NO_SUCH = "00000000-0000-4000-8000-000000000000";
const url = (gid: string) => `https://app.test/api/groups/${gid}/invites`;
const create = (body?: unknown, headers: Record<string, string> = {}, gid = groupId) =>
  createInviteHandler(
    new Request(url(gid), {
      method: "POST",
      headers: body === undefined ? headers : { "content-type": "application/json", ...headers },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    }),
    gid,
    deps,
  );
const list = (gid = groupId) => listInvitesHandler(new Request(url(gid)), gid, deps);
const revoke = (inviteId: string, headers: Record<string, string> = {}, gid = groupId) =>
  revokeInviteHandler(new Request(`${url(gid)}/${inviteId}`, { method: "DELETE", headers }), gid, inviteId, deps);
const count = async () => Number((await db.query<{ n: string }>("select count(*) n from group_invites"))[0].n);

describe("POST /api/groups/[id]/invites (API-16)", () => {
  it("201 with id, token, expiry, and cap; defaults to 7 days and 10 uses with no body", async () => {
    const res = await create();
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["expiresAt", "id", "maxUses", "token"]);
    expect(body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(body.maxUses).toBe(10);
    const days = (new Date(body.expiresAt).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThanOrEqual(7);
  });

  it("honours a body, and an empty object means defaults", async () => {
    expect((await (await create({ expiresInDays: 1, maxUses: 3 })).json()).maxUses).toBe(3);
    expect((await (await create({})).json()).maxUses).toBe(10);
  });

  it("the token it returns really works, and only its hash is stored", async () => {
    const { token, id } = await (await create({ maxUses: 1 })).json();
    const rows = await db.query<{ token_hash: string; created_by: string }>("select token_hash, created_by from group_invites where id = $1", [id]);
    expect(rows[0].token_hash).toBe(hashToken(token));
    expect(rows[0].created_by).toBe("alice");
    expect((await joinWithInvite(db, "mallory", token)).joined).toBe(true);
  });

  it("the invite belongs to the URL's group and the session user, whatever the body says", async () => {
    const other = await createGroup(db, "alice", "Study abroad");
    await create({ groupId: other.id, created_by: "mallory", token: "A".repeat(43) });
    expect(await db.query("select group_id, created_by from group_invites")).toEqual([{ group_id: groupId, created_by: "alice" }]);
  });

  it.each([
    ["0 days", { expiresInDays: 0 }],
    ["31 days", { expiresInDays: 31 }],
    ["1.5 days", { expiresInDays: 1.5 }],
    ["days as a string", { expiresInDays: "7" }],
    ["days null", { expiresInDays: null }],
    ["0 uses", { maxUses: 0 }],
    ["51 uses", { maxUses: 51 }],
    ["uses as a string", { maxUses: "10" }],
    ["a body that is not an object", []],
  ])("400 for %s, and nothing is stored", async (_label, body) => {
    const res = await create(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
    expect(await count()).toBe(0);
  });

  it("400 for malformed JSON", async () => {
    expect((await create("{nope")).status).toBe(400);
  });

  it("a plain member, a non-member, an unknown group, and a malformed group id get the identical 404", async () => {
    const answers: Response[] = [];
    user = "bea"; answers.push(await create());
    user = "mallory"; answers.push(await create());
    user = "alice"; answers.push(await create(undefined, {}, NO_SUCH), await create(undefined, {}, "not-a-uuid"));
    for (const res of answers) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    }
    expect(await count()).toBe(0);
  });

  it("401 signed out, 403 cross-origin, 415 non-JSON body; nothing stored", async () => {
    user = null;
    expect((await create()).status).toBe(401);
    user = "alice";
    expect((await create({}, { origin: "https://evil.test" })).status).toBe(403);
    expect((await create("hi", { "content-type": "text/plain" })).status).toBe(415);
    expect(await count()).toBe(0);
  });
});

describe("GET /api/groups/[id]/invites (API-17)", () => {
  it("lists active invites newest first, with exactly the safe fields", async () => {
    const first = await createInvite(db, "alice", groupId, { maxUses: 3 });
    const second = await createInvite(db, "alice", groupId);
    await db.query("update group_invites set created_at = now() - interval '1 hour' where id = $1", [first.id]);
    const res = await list();
    expect(res.status).toBe(200);
    const { invites } = await res.json();
    expect(invites.map((i: { id: string }) => i.id)).toEqual([second.id, first.id]);
    expect(Object.keys(invites[1]).sort()).toEqual(["createdAt", "expiresAt", "id", "maxUses", "useCount"]);
  });

  it("never contains a token or its hash", async () => {
    const { token } = await (await create()).json();
    const text = await (await list()).text();
    expect(text).not.toContain(token);
    expect(text).not.toContain(hashToken(token));
  });

  it("leaves out revoked and expired invites, and other groups' invites", async () => {
    const revoked = await createInvite(db, "alice", groupId);
    const expired = await createInvite(db, "alice", groupId);
    const live = await createInvite(db, "alice", groupId);
    const other = await createGroup(db, "alice", "Study abroad");
    await createInvite(db, "alice", other.id);
    await revoke(revoked.id);
    await db.query("update group_invites set expires_at = now() - interval '1 minute' where id = $1", [expired.id]);
    const { invites } = await (await list()).json();
    expect(invites.map((i: { id: string }) => i.id)).toEqual([live.id]);
  });

  it("an empty list is 200, not 404", async () => {
    expect(await (await list()).json()).toEqual({ invites: [] });
  });

  it("a plain member, a non-member, an unknown group, and a malformed group id get the identical 404", async () => {
    await createInvite(db, "alice", groupId);
    const answers: Response[] = [];
    user = "bea"; answers.push(await list());
    user = "mallory"; answers.push(await list());
    user = "alice"; answers.push(await list(NO_SUCH), await list("not-a-uuid"));
    for (const res of answers) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    }
  });

  it("401 when signed out", async () => {
    user = null;
    expect((await list()).status).toBe(401);
  });
});

describe("DELETE /api/groups/[id]/invites/[inviteId] (API-18)", () => {
  it("200 revoked:true, and the link stops working at once", async () => {
    const { id, token } = await (await create()).json();
    const res = await revoke(id);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revoked: true });
    await expect(joinWithInvite(db, "mallory", token)).rejects.toBeInstanceOf(NotFoundError);
    expect(await (await list()).json()).toEqual({ invites: [] });
  });

  it("people who already joined stay in the group", async () => {
    const { id, token } = await (await create()).json();
    await joinWithInvite(db, "mallory", token);
    await revoke(id);
    expect(await requireMember(db, "mallory", groupId)).toBe("member");
  });

  it("a plain member and a non-member get 404, and the invite stays usable", async () => {
    const { id, token } = await (await create()).json();
    for (const u of ["bea", "mallory"]) {
      user = u;
      const res = await revoke(id);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
    }
    user = "dee";
    expect((await joinWithInvite(db, "dee", token)).joined).toBe(true);
  });

  it("another group's invite, an unknown id, a malformed id, and an already revoked one are the identical 404", async () => {
    const other = await createGroup(db, "alice", "Study abroad");
    const theirs = await createInvite(db, "alice", other.id);
    const done = await createInvite(db, "alice", groupId);
    await revoke(done.id);
    for (const id of [theirs.id, NO_SUCH, "not-a-uuid", "1; drop table group_invites", done.id]) {
      const res = await revoke(id);
      expect(res.status, id).toBe(404);
      expect(await res.json(), id).toEqual({ error: "not_found" });
    }
    expect((await (await list(other.id)).json()).invites).toHaveLength(1);
  });

  it("401 signed out and 403 cross-origin; the invite stays", async () => {
    const { id, token } = await (await create()).json();
    user = null;
    expect((await revoke(id)).status).toBe(401);
    user = "alice";
    expect((await revoke(id, { origin: "https://evil.test" })).status).toBe(403);
    expect((await joinWithInvite(db, "mallory", token)).joined).toBe(true);
  });
});

describe("responses are private, no-store (API-7)", () => {
  it("success and failure on all three endpoints", async () => {
    const { id } = await (await create()).json();
    const all = [await create(), await create({ maxUses: 0 }), await list(), await revoke(id), await revoke("nope")];
    for (const res of all) expect(res.headers.get("cache-control")).toBe("private, no-store");
  });
});
