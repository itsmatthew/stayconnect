import { beforeEach, describe, expect, it } from "vitest";
import { createGroup, ensureUser, requireMember } from "../../src/server/groups";
import { NotFoundError } from "../../src/server/errors";
import type { Db } from "../../src/server/db";
import { applyMigrations, newTestDb } from "./helpers";
import { addMember } from "./helpers";
import type { PGlite } from "@electric-sql/pglite";

let db: Db;
let pg: PGlite;
beforeEach(async () => {
  ({ db, pg } = await newTestDb());
});

describe("groups (BE-1, BE-2)", () => {
  it("BE-1: the creator becomes the owner", async () => {
    const group = await createGroup(db, "alice", "Sorority");
    expect(group.name).toBe("Sorority");
    expect(await requireMember(db, "alice", group.id)).toBe("owner");
  });

  it("BE-1: added members have the member role", async () => {
    const group = await createGroup(db, "alice", "Sorority");
    await addMember(db, group.id, "bea");
    expect(await requireMember(db, "bea", group.id)).toBe("member");
  });

  it("BE-1: rejects an empty group name", async () => {
    await expect(createGroup(db, "alice", "   ")).rejects.toThrow();
  });

  it("BE-1: trims the group name", async () => {
    const group = await createGroup(db, "alice", "  Sorority  ");
    expect(group.name).toBe("Sorority");
  });

  it("BE-1: creating groups for the same user twice keeps one user row", async () => {
    await createGroup(db, "alice", "One");
    await createGroup(db, "alice", "Two");
    await ensureUser(db, "alice");
    const rows = await db.query<{ count: string }>("select count(*)::text as count from users where id = 'alice'");
    expect(rows[0].count).toBe("1");
  });

  it("BE-2: a user who never signed up is not a member of anything", async () => {
    const group = await createGroup(db, "alice", "Sorority");
    await expect(requireMember(db, "ghost", group.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("BE-15: rejects a group name over 80 characters", async () => {
    await expect(createGroup(db, "alice", "x".repeat(81))).rejects.toThrow();
    await expect(createGroup(db, "alice", "x".repeat(80))).resolves.toBeDefined();
  });

  it("BE-2: a non-member and a missing group get the same error", async () => {
    const group = await createGroup(db, "alice", "Sorority");
    await ensureUser(db, "mallory");
    const asOutsider = await requireMember(db, "mallory", group.id).catch((e) => e);
    const missing = await requireMember(db, "alice", "00000000-0000-0000-0000-000000000000").catch((e) => e);
    expect(asOutsider).toBeInstanceOf(NotFoundError);
    expect(missing).toBeInstanceOf(NotFoundError);
    expect(asOutsider.message).toBe(missing.message);
  });

  it("BE-2: a malformed group id is also NotFound, not a database error", async () => {
    await expect(requireMember(db, "alice", "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("migrations (BE-14)", () => {
  it("re-running every migration is harmless", async () => {
    await createGroup(db, "alice", "Sorority");
    await applyMigrations(pg);
    const rows = await db.query<{ count: string }>("select count(*)::text as count from groups");
    expect(rows[0].count).toBe("1");
  });
});
