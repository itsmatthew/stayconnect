import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGroupHandler, listGroupsHandler } from "../../../src/server/http/groups";
import type { Deps } from "../../../src/server/http/kit";
import type { Db } from "../../../src/server/db";
import { newTestDb } from "../helpers";

let db: Db;
let user: string | null;
let deps: Deps;
beforeEach(async () => {
  ({ db } = await newTestDb());
  user = "alice";
  deps = { db, getUserId: async () => user };
});

const url = "https://app.test/api/groups";
const post = (body: unknown, headers: Record<string, string> = {}) =>
  createGroupHandler(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    deps,
  );
const list = (headers: Record<string, string> = {}) => listGroupsHandler(new Request(url, { headers }), deps);
const count = async (table: string) => Number((await db.query<{ n: string }>(`select count(*) n from ${table}`))[0].n);

describe("shared rules (API-1..API-7)", () => {
  it("API-1: signed-out POST gets 401 and stores nothing", async () => {
    user = null;
    const res = await post({ name: "Sorority" });
    expect(res.status).toBe(401);
    expect(await count("groups")).toBe(0);
  });

  it("API-1: signed-out GET gets 401", async () => {
    user = null;
    expect((await list()).status).toBe(401);
  });

  it("API-1: a failing session lookup is a 401, never an open door", async () => {
    deps = { db, getUserId: async () => { throw new Error("no clerk context"); } };
    expect((await post({ name: "x" })).status).toBe(401);
  });

  it("API-1: 401 is checked before Origin and content type", async () => {
    user = null;
    const res = await post("not json", { origin: "https://evil.test", "content-type": "text/plain" });
    expect(res.status).toBe(401);
  });

  it("API-2: a POST from another origin gets 403 and stores nothing", async () => {
    const res = await post({ name: "Sorority" }, { origin: "https://evil.test" });
    expect(res.status).toBe(403);
    expect(await count("groups")).toBe(0);
  });

  it("API-2: a POST from the same origin is allowed", async () => {
    expect((await post({ name: "Sorority" }, { origin: "https://app.test" })).status).toBe(201);
  });

  it("API-2: a POST with no Origin header is allowed", async () => {
    expect((await post({ name: "Sorority" })).status).toBe(201);
  });

  it("API-2: GET is not origin-checked", async () => {
    expect((await list({ origin: "https://evil.test" })).status).toBe(200);
  });

  it("API-3: a non-JSON content type gets 415", async () => {
    const res = await post({ name: "Sorority" }, { "content-type": "text/plain" });
    expect(res.status).toBe(415);
    expect(await count("groups")).toBe(0);
  });

  it("API-3: a JSON content type with a charset is accepted", async () => {
    expect((await post({ name: "Sorority" }, { "content-type": "application/json; charset=utf-8" })).status).toBe(201);
  });

  it.each([
    ["empty name", { name: "" }],
    ["blank name", { name: "   " }],
    ["name too long", { name: "x".repeat(81) }],
    ["name not a string", { name: 5 }],
    ["missing name", {}],
    ["body not an object", []],
  ])("API-4: %s gets 400 and stores nothing", async (_label, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
    expect(await count("groups")).toBe(0);
  });

  it("API-4: malformed JSON gets 400", async () => {
    expect((await post("{not json")).status).toBe(400);
  });

  it("API-4: the 400 body never echoes the submitted value", async () => {
    const text = await (await post({ name: "x".repeat(81) + "SECRET-MARKER" })).text();
    expect(text).not.toContain("SECRET-MARKER");
  });

  it("API-6: an unexpected error is a generic 500 and the log has no request body", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    deps = { ...deps, db: { query: async () => { throw new Error("connection refused"); } } };
    const res = await post({ name: "BODY-MARKER" });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal" });
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).toContain("connection refused");
    expect(logged).not.toContain("BODY-MARKER");
    log.mockRestore();
  });

  it("API-7: success, error, and list responses are all private, no-store", async () => {
    const ok = await post({ name: "Sorority" });
    const bad = await post({ name: "" });
    user = null;
    const denied = await post({ name: "x" });
    for (const res of [ok, bad, denied, await list()]) {
      expect(res.headers.get("cache-control")).toBe("private, no-store");
    }
  });
});

describe("groups (API-8, API-9)", () => {
  it("API-8: creates a group and returns 201 with id and name", async () => {
    const res = await post({ name: "  Sorority  " });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Sorority");
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("API-8: the caller becomes the owner", async () => {
    await post({ name: "Sorority" });
    const { groups } = await (await list()).json();
    expect(groups[0].role).toBe("owner");
  });

  it("API-8: the owner is the session user, even if the body names someone else", async () => {
    await post({ name: "Sorority", userId: "mallory", created_by: "mallory" });
    const rows = await db.query<{ user_id: string }>("select user_id from group_members");
    expect(rows).toEqual([{ user_id: "alice" }]);
  });

  it("API-9: lists only the caller's groups, newest first", async () => {
    await post({ name: "One" });
    await post({ name: "Two" });
    user = "bea";
    await post({ name: "Bea's" });
    user = "alice";
    const { groups } = await (await list()).json();
    expect(groups.map((g: { name: string }) => g.name)).toEqual(["Two", "One"]);
    expect(groups[0]).toEqual({ id: expect.any(String), name: "Two", role: "owner" });
  });

  it("API-9: a user with no groups gets an empty list", async () => {
    user = "carol";
    const res = await list();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ groups: [] });
  });
});
