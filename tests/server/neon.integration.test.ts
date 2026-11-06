import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "../../src/server/db";
import { createGroup } from "../../src/server/groups";
import { createInvite, joinWithInvite, previewInvite } from "../../src/server/invites";
import { deleteMemory, getMemory, listInbox, listSent, replyToMemory, sendMemory } from "../../src/server/memories";

// Runs the real Neon driver against a THROWAWAY Neon branch. Off by default: it needs NEON_INTEGRATION=1 and a
// DATABASE_URL pointing at that branch (never the main database). See tests/server/CLAUDE.md.
const enabled = process.env.NEON_INTEGRATION === "1" && !!process.env.DATABASE_URL;

describe.skipIf(!enabled)("Neon (real driver, throwaway branch)", () => {
  const run = randomUUID().slice(0, 8);
  const [alice, bea] = [`it-${run}-alice`, `it-${run}-bea`];
  const racers = Array.from({ length: 6 }, (_, i) => `it-${run}-racer${i}`);
  const migrate = () => execFileSync("node", ["scripts/migrate.mjs"], { env: process.env, encoding: "utf8" });

  afterAll(async () => {
    // Deleting the users cascades to their groups' memberships, memories, recipients, and replies.
    await getDb().query("delete from users where id = any($1)", [[alice, bea, ...racers]]);
  }, 30_000);

  it("BE-14: all migrations apply, twice in a row", () => {
    migrate();
    expect(migrate()).toContain("Migrations applied.");
  }, 60_000);

  it("send, inbox, reply, sealed sent list, get, and delete work through getDb()", async () => {
    const db = getDb();
    const group = await createGroup(db, alice, "Integration");
    await db.query("insert into users (id) values ($1) on conflict do nothing", [bea]);
    await db.query("insert into group_members (group_id, user_id, role) values ($1, $2, 'member')", [group.id, bea]);

    const { id } = await sendMemory(db, alice, { groupId: group.id, caption: "hello" });
    const inbox = await listInbox(db, bea);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toMatchObject({ id, caption: "hello", senderId: alice, replied: false });
    expect(inbox[0].createdAt).toBeInstanceOf(Date); // the driver's timestamp parsing matches what the code assumes

    expect(await listSent(db, alice)).toEqual([]); // sealed until reply
    await replyToMemory(db, bea, id);
    await replyToMemory(db, bea, id); // idempotent
    const sent = await listSent(db, alice);
    expect(sent).toHaveLength(1);
    expect(sent[0].replies).toHaveLength(1); // json_agg arrives parsed
    expect(sent[0].replies[0].userId).toBe(bea);
    expect(sent[0].replies[0].createdAt).toBeInstanceOf(Date);
    expect(await getMemory(db, alice, id)).toMatchObject({ id });

    await deleteMemory(db, alice, id);
    expect(await listInbox(db, bea)).toEqual([]);
  }, 60_000);

  it("INV-6, INV-8: invite create, preview, and join work through getDb(), with numbers and dates parsed", async () => {
    const db = getDb();
    const group = await createGroup(db, alice, "Invites");
    const invite = await createInvite(db, alice, group.id, { maxUses: 3 });
    expect(invite.expiresAt).toBeInstanceOf(Date);
    const preview = await previewInvite(db, racers[0], invite.token);
    expect(preview).toEqual({ groupName: "Invites", inviterId: alice, memberCount: 1, alreadyMember: false });
    expect(typeof preview.memberCount).toBe("number"); // count(*) is bigint, which arrives as a string unless cast
    expect(await joinWithInvite(db, racers[0], invite.token)).toMatchObject({ groupId: group.id, joined: true });
    expect(await joinWithInvite(db, racers[0], invite.token)).toMatchObject({ joined: false });
  }, 60_000);

  it("INV-8: six joins racing for the last use admit exactly one (real concurrency)", async () => {
    const db = getDb();
    const group = await createGroup(db, alice, "Race");
    const { token, id } = await createInvite(db, alice, group.id, { maxUses: 1 });
    const results = await Promise.allSettled(racers.map((user) => joinWithInvite(db, user, token)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const members = await db.query<{ n: string }>("select count(*) n from group_members where group_id = $1", [group.id]);
    expect(Number(members[0].n)).toBe(2); // alice and the one winner
    const uses = await db.query<{ use_count: number }>("select use_count from group_invites where id = $1", [id]);
    expect(uses[0].use_count).toBe(1);
  }, 60_000);
});
