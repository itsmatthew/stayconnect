import { describe, expect, it } from "vitest";
import { GET, POST } from "../../../src/app/api/groups/route";

/**
 * The only test that goes through the real route file and the real Clerk helper. Outside a Next request
 * there is no session, so a signed-out answer here proves the wiring fails closed (API-1).
 */
describe("groups route wiring (API-1)", () => {
  it("API-1: POST with no session is 401", async () => {
    const res = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Sorority" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("API-1: GET with no session is 401", async () => {
    expect((await GET(new Request("http://localhost/api/groups"))).status).toBe(401);
  });
});

describe("memory routes wiring (API-1)", () => {
  const signedOut = async (res: Response | Promise<Response>) => expect((await res).status).toBe(401);

  it("API-1: every memory route with no session is 401", async () => {
    const { POST: send } = await import("../../../src/app/api/memories/route");
    const { GET: inbox } = await import("../../../src/app/api/memories/inbox/route");
    const { GET: one } = await import("../../../src/app/api/memories/[id]/route");
    await signedOut(
      send(
        new Request("http://localhost/api/memories", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ groupId: "00000000-0000-4000-8000-000000000000", caption: "hi" }),
        }),
      ),
    );
    await signedOut(inbox(new Request("http://localhost/api/memories/inbox")));
    const { GET: sent } = await import("../../../src/app/api/memories/sent/route");
    const { DELETE: remove } = await import("../../../src/app/api/memories/[id]/route");
    const { POST: reply } = await import("../../../src/app/api/memories/[id]/reply/route");
    const ctx = { params: Promise.resolve({ id: "abc" }) };
    await signedOut(sent(new Request("http://localhost/api/memories/sent")));
    await signedOut(remove(new Request("http://localhost/api/memories/abc", { method: "DELETE" }), ctx));
    await signedOut(reply(new Request("http://localhost/api/memories/abc/reply", { method: "POST" }), ctx));
    await signedOut(
      one(new Request("http://localhost/api/memories/abc"), { params: Promise.resolve({ id: "abc" }) }),
    );
  });
});
