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
