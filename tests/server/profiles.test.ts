import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../src/server/db";
import { NotFoundError } from "../../src/server/errors";
import { createGroup } from "../../src/server/groups";
import { getProfiles, resolveName, seedProfile, updateDisplayName } from "../../src/server/profiles";
import { addMember, newTestDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  ({ db } = await newTestDb());
});

const clerk = (over: Partial<Parameters<typeof seedProfile>[2] & object> = {}) => ({
  firstName: "Maya",
  lastName: "Ortiz",
  username: "maya_o",
  imageUrl: "https://img.clerk.com/maya.png",
  hasImage: true,
  ...over,
});
const stored = async (id: string) =>
  (await db.query<{ display_name: string | null; avatar_url: string | null }>(
    "select display_name, avatar_url from users where id = $1",
    [id],
  ))[0];

describe("resolveName (PRF-1)", () => {
  it("PRF-1: our name wins, then first name, then username", () => {
    expect(resolveName({ displayName: "Mimi", firstName: "Maya", username: "m" })).toBe("Mimi");
    expect(resolveName({ displayName: null, firstName: "Maya", username: "m" })).toBe("Maya");
    expect(resolveName({ displayName: null, firstName: null, username: "m" })).toBe("m");
  });

  it("PRF-1: blank values are skipped, and the result is trimmed", () => {
    expect(resolveName({ displayName: "   ", firstName: " Maya ", username: "m" })).toBe("Maya");
    expect(resolveName({ displayName: "", firstName: "\t", username: " m " })).toBe("m");
  });

  it("PRF-1: with nothing usable the name is Someone, never empty", () => {
    expect(resolveName({})).toBe("Someone");
    expect(resolveName({ displayName: null, firstName: " ", username: undefined })).toBe("Someone");
  });
});

describe("seedProfile (PRF-2)", () => {
  it("PRF-2: creates the user and stores the first name and the image", async () => {
    const profile = await seedProfile(db, "maya", clerk());
    expect(profile).toEqual({ id: "maya", displayName: "Maya", avatarUrl: "https://img.clerk.com/maya.png" });
    expect(await stored("maya")).toEqual({ display_name: "Maya", avatar_url: "https://img.clerk.com/maya.png" });
  });

  it("PRF-2: falls back to the username when there is no first name", async () => {
    expect((await seedProfile(db, "a", clerk({ firstName: null }))).displayName).toBe("maya_o");
    expect((await seedProfile(db, "b", clerk({ firstName: "  " }))).displayName).toBe("maya_o");
  });

  it("PRF-2: with no usable name nothing is stored, and the profile shows Someone", async () => {
    const profile = await seedProfile(db, "a", clerk({ firstName: null, username: null }));
    expect(profile.displayName).toBe("Someone");
    expect((await stored("a")).display_name).toBeNull();
  });

  it("PRF-2: never overwrites a name the user chose", async () => {
    await updateDisplayName(db, "maya", "Mimi");
    const profile = await seedProfile(db, "maya", clerk({ firstName: "Maria" }));
    expect(profile.displayName).toBe("Mimi");
    expect((await stored("maya")).display_name).toBe("Mimi");
  });

  it("PRF-2: a name from Clerk is cut to 50 characters, counting an emoji as one", async () => {
    const long = "😀".repeat(60);
    const profile = await seedProfile(db, "a", clerk({ firstName: long }));
    expect([...profile.displayName]).toHaveLength(50);
  });

  it("PRF-2: refreshes the image when it changes, and clears it when Clerk has none", async () => {
    await seedProfile(db, "maya", clerk());
    await seedProfile(db, "maya", clerk({ imageUrl: "https://img.clerk.com/new.png" }));
    expect((await stored("maya")).avatar_url).toBe("https://img.clerk.com/new.png");
    const none = await seedProfile(db, "maya", clerk({ hasImage: false, imageUrl: "https://img.clerk.com/default.png" }));
    expect(none.avatarUrl).toBeNull();
    expect((await stored("maya")).avatar_url).toBeNull();
  });

  it("PRF-2: an image that is not https, or is over 2048 characters, is stored as null", async () => {
    for (const imageUrl of [
      "http://img.clerk.com/a.png",
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
      "//img.clerk.com/a.png",
      `https://img.clerk.com/${"a".repeat(2048)}`,
    ]) {
      const profile = await seedProfile(db, "maya", clerk({ imageUrl }));
      expect(profile.avatarUrl, imageUrl.slice(0, 30)).toBeNull();
    }
    expect((await stored("maya")).avatar_url).toBeNull();
  });

  it("PRF-2: when Clerk is unreachable (null) nothing changes and nothing fails", async () => {
    await seedProfile(db, "maya", clerk());
    const profile = await seedProfile(db, "maya", null);
    expect(profile).toEqual({ id: "maya", displayName: "Maya", avatarUrl: "https://img.clerk.com/maya.png" });
    const fresh = await seedProfile(db, "newbie", null);
    expect(fresh).toEqual({ id: "newbie", displayName: "Someone", avatarUrl: null });
  });

  it("PRF-2: seeding twice is harmless", async () => {
    const a = await seedProfile(db, "maya", clerk());
    const b = await seedProfile(db, "maya", clerk());
    expect(b).toEqual(a);
    expect(Number((await db.query<{ n: string }>("select count(*) n from users where id = 'maya'"))[0].n)).toBe(1);
  });
});

describe("updateDisplayName (PRF-3)", () => {
  it("PRF-3: trims, stores, and returns the profile; creates the user if needed", async () => {
    const profile = await updateDisplayName(db, "maya", "  Mimi  ");
    expect(profile).toEqual({ id: "maya", displayName: "Mimi", avatarUrl: null });
    expect((await stored("maya")).display_name).toBe("Mimi");
  });

  it("PRF-3: leaves the avatar alone", async () => {
    await seedProfile(db, "maya", clerk());
    const profile = await updateDisplayName(db, "maya", "Mimi");
    expect(profile.avatarUrl).toBe("https://img.clerk.com/maya.png");
  });

  it("PRF-3: 50 characters is fine, an emoji counts as one", async () => {
    expect((await updateDisplayName(db, "a", "x".repeat(50))).displayName).toHaveLength(50);
    expect([...(await updateDisplayName(db, "b", "😀".repeat(50))).displayName]).toHaveLength(50);
  });

  it("PRF-3: blank or over 50 characters is rejected and nothing changes", async () => {
    await updateDisplayName(db, "maya", "Maya");
    for (const bad of ["", "   ", "\n\t", "x".repeat(51), "😀".repeat(51)]) {
      await expect(updateDisplayName(db, "maya", bad), JSON.stringify(bad.slice(0, 10))).rejects.toThrow();
    }
    expect((await stored("maya")).display_name).toBe("Maya");
  });

  it("PRF-3: the database enforces the same limits, and only https avatars", async () => {
    await seedProfile(db, "maya", clerk());
    await expect(db.query("update users set display_name = $1 where id = 'maya'", ["x".repeat(51)])).rejects.toThrow();
    await expect(db.query("update users set display_name = '  ' where id = 'maya'")).rejects.toThrow();
    await expect(db.query("update users set avatar_url = 'http://x.test/a.png' where id = 'maya'")).rejects.toThrow();
    await expect(db.query("update users set avatar_url = 'javascript:alert(1)' where id = 'maya'")).rejects.toThrow();
  });
});

describe("getProfiles (PRF-4)", () => {
  let groupId: string;
  beforeEach(async () => {
    groupId = (await createGroup(db, "alice", "Sorority")).id;
    await addMember(db, groupId, "bea");
    await addMember(db, groupId, "cy");
    // Same-instant inserts would tie on joined_at and fall back to the id; make the order unambiguous.
    await db.query("update group_members set joined_at = now() - interval '2 hours' where user_id = 'bea'");
    await db.query("update group_members set joined_at = now() - interval '1 hour' where user_id = 'cy'");
    await seedProfile(db, "alice", clerk({ firstName: "Alice", imageUrl: "https://img.clerk.com/alice.png" }));
    await updateDisplayName(db, "bea", "Bea");
  });

  it("PRF-4: a member sees every member with name, avatar and role, owner first then by joining order", async () => {
    const profiles = await getProfiles(db, "bea", groupId);
    expect(profiles).toEqual([
      { id: "alice", displayName: "Alice", avatarUrl: "https://img.clerk.com/alice.png", role: "owner" },
      { id: "bea", displayName: "Bea", avatarUrl: null, role: "member" },
      { id: "cy", displayName: "Someone", avatarUrl: null, role: "member" },
    ]);
  });

  it("PRF-4: the owner sees the same list", async () => {
    expect((await getProfiles(db, "alice", groupId)).map((p) => p.id)).toEqual(["alice", "bea", "cy"]);
  });

  it("PRF-4: a non-member, an unknown group, and a malformed id are the same NotFoundError", async () => {
    await db.query("insert into users (id) values ('mallory')");
    const unknown = "00000000-0000-4000-8000-000000000000";
    for (const [who, gid] of [["mallory", groupId], ["alice", unknown], ["alice", "not-a-uuid"], ["alice", "x' or '1'='1"]]) {
      await expect(getProfiles(db, who, gid), `${who} ${gid}`).rejects.toBeInstanceOf(NotFoundError);
    }
  });

  it("PRF-4: a member of another group sees nothing here, and this group's people stay out of theirs", async () => {
    const other = (await createGroup(db, "dana", "Book club")).id;
    await expect(getProfiles(db, "dana", groupId)).rejects.toBeInstanceOf(NotFoundError);
    expect((await getProfiles(db, "dana", other)).map((p) => p.id)).toEqual(["dana"]);
  });

  it("PRF-4: someone who left is no longer listed", async () => {
    await db.query("delete from group_members where user_id = 'cy'");
    expect((await getProfiles(db, "alice", groupId)).map((p) => p.id)).toEqual(["alice", "bea"]);
  });

  it("PRF-4: returns exactly id, displayName, avatarUrl and role", async () => {
    for (const p of await getProfiles(db, "alice", groupId)) {
      expect(Object.keys(p).sort()).toEqual(["avatarUrl", "displayName", "id", "role"]);
    }
  });
});
