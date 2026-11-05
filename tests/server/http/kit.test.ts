import { describe, expect, it } from "vitest";
import { handle, type Deps } from "../../../src/server/http/kit";
import { NoRecipientsError, NotFoundError } from "../../../src/server/errors";

const deps: Deps = { db: { query: async () => [] }, getUserId: async () => "alice" };
const req = () => new Request("https://app.test/api/x");
const throwing = (err: unknown) => handle(req(), deps, async () => { throw err; });

describe("error mapping (API-5)", () => {
  it("API-5: NotFoundError is 404 not_found", async () => {
    const res = await throwing(new NotFoundError());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("API-5: NoRecipientsError is 409 no_recipients", async () => {
    const res = await throwing(new NoRecipientsError());
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "no_recipients" });
  });

  it("API-6: a thrown non-Error value is still a generic 500", async () => {
    const res = await throwing("a string, not an Error");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal" });
  });
});
