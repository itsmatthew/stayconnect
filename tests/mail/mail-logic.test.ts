import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkDrop, type DropRecord } from "@/app/intro/mail/drop-limits";
import { fakeDirectory } from "@/app/intro/mail/directory";
import { DEFAULT_WHO_CAN_DROP, WHO_CAN_DROP, isWhoCanDrop, mailboxAllows } from "@/app/intro/mail/mailbox-setting";
import { formatPhone, normalizePhone, parseFindQuery } from "@/app/intro/mail/find-query";
import { nameMatch, rankCandidates } from "@/app/intro/mail/search-rank";

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 9, 12).getTime();

describe("reading the search box (MAIL-2)", () => {
  it("tells a phone number, an @username and a name apart", () => {
    expect(parseFindQuery("(555) 012-3456")).toEqual({ kind: "phone", phone: "+15550123456" });
    expect(parseFindQuery("+44 20 7946 0958")).toEqual({ kind: "phone", phone: "+442079460958" });
    expect(parseFindQuery("@KateM")).toEqual({ kind: "username", username: "katem" });
    expect(parseFindQuery("  kate ")).toEqual({ kind: "name", text: "kate" });
    expect(parseFindQuery("   ")).toEqual({ kind: "empty" });
    expect(parseFindQuery("555")).toEqual({ kind: "name", text: "555" });
  });

  it("normalizes and formats numbers", () => {
    expect(normalizePhone("555.012.3456")).toBe("+15550123456");
    expect(normalizePhone("1 555 012 3456")).toBe("+15550123456");
    expect(normalizePhone("12")).toBeUndefined();
    expect(formatPhone("+15550123456")).toBe("(555) 012-3456");
    expect(formatPhone("+442079460958")).toBe("+44 2079460958");
  });
});

describe("finding people (MAIL-3)", () => {
  const dir = fakeDirectory([
    { id: "kate", name: "Kate Morgan", username: "katem", phone: "+15550123456", findableByName: true, mutual: ["Leo", "Ana"], look: { skin: "#F1C7A0", hair: "#B8562E", shirt: "#7A4E8C", bg: "#E6D3F0", ring: "#7A4E8C" } },
    { id: "theo", name: "Theo Park", username: "theop", phone: "+15550000000", findableByName: false, mutual: [], mailbox: "friendsOfFriends", look: { skin: "#F1C7A0", hair: "#8C8C8C", shirt: "#4F8F8B", bg: "#F6D9A8", ring: "#4F8F8B" } },
  ]);

  it("matches names, ignoring case, only for people who let themselves be found", async () => {
    expect((await dir.search({ kind: "name", text: "kate" })).map((p) => p.id)).toEqual(["kate"]);
    expect(await dir.search({ kind: "name", text: "theo" })).toEqual([]);
  });

  it("still finds anyone by their exact username, with or without the @", async () => {
    expect((await dir.search({ kind: "username", username: "theop" })).map((p) => p.id)).toEqual(["theo"]);
    expect((await dir.search({ kind: "name", text: "theop" })).map((p) => p.id)).toEqual(["theo"]);
    expect(await dir.search({ kind: "username", username: "theo" })).toEqual([]);
  });

  it("finishes a partial @username as you type, but only for people who let themselves be found", async () => {
    expect((await dir.search({ kind: "username", username: "kat" })).map((p) => p.id)).toEqual(["kate"]);
    expect((await dir.search({ kind: "name", text: "kat" })).map((p) => p.id)).toEqual(["kate"]);
    expect(await dir.search({ kind: "username", username: "the" })).toEqual([]);
  });

  it("returns only a minimal card: photo, name, username, mutual friends, and whether you can drop", async () => {
    const [kate] = await dir.search({ kind: "name", text: "kate" });
    expect(Object.keys(kate).sort()).toEqual(["canDrop", "id", "look", "mutual", "name", "username"]);
    expect(kate.mutual).toEqual({ count: 2, names: ["Leo", "Ana"] });
  });

  it("never lists anyone by phone number: a number is only used when dropping", async () => {
    expect(await dir.search({ kind: "phone", phone: "+15550123456" })).toEqual([]);
    expect(await dir.accountFor("+15550123456")).toBe("kate");
    expect(await dir.accountFor("+15559999999")).toBeUndefined();
  });
});

describe("the order of results (MAIL-12)", () => {
  const c = (name: string, mutualCount = 0, more: { inCircle?: boolean; exactUsername?: boolean } = {}) => ({ name, mutualCount, inCircle: false, ...more });

  it("rates a match: first name, then a later name, then anywhere", () => {
    expect(nameMatch("Kate Morgan", "kate")).toBe(0);
    expect(nameMatch("Anna Kateb", "kate")).toBe(1);
    expect(nameMatch("Mckate Lee", "kate")).toBe(2);
    expect(nameMatch("Leo", "kate")).toBeUndefined();
  });

  it("puts an exact @username first, then your circle, then most mutual friends", () => {
    const list = [c("Kate Sullivan"), c("Kate Morgan", 2), c("Kate Lin", 0, { inCircle: true }), c("Kate Bishop", 4), c("Kate Exact", 0, { exactUsername: true })];
    expect(rankCandidates(list, "kate").map((p) => p.name)).toEqual(["Kate Exact", "Kate Lin", "Kate Bishop", "Kate Morgan", "Kate Sullivan"]);
  });

  it("with the same mutual friends, the better name match wins, then A to Z", () => {
    const list = [c("Mckate Lee", 1), c("Anna Kateb", 1), c("Kate Zane", 1), c("Kate Adams", 1), c("Bo Katz", 1)];
    expect(rankCandidates(list, "kat").map((p) => p.name)).toEqual(["Kate Adams", "Kate Zane", "Anna Kateb", "Bo Katz", "Mckate Lee"]);
  });

  it("puts someone matched only by username after name matches", () => {
    expect(rankCandidates([c("Zed", 1), c("Kate Morgan", 1)], "kat").map((p) => p.name)).toEqual(["Kate Morgan", "Zed"]);
  });
});

describe("limits on drops outside your circle (MAIL-6)", () => {
  const out = (to: string, daysAgo: number): DropRecord => ({ to, at: NOW - daysAgo * DAY, outside: true });

  it("has no per-person wait: the same person can get another drop right away", () => {
    expect(checkDrop([out("kate", 0)], true, NOW)).toEqual({ ok: true });
    expect(checkDrop([out("kate", 0), out("kate", 1)], true, NOW)).toEqual({ ok: true });
  });

  it("allows three drops outside your circle in any 7 days, invites included", () => {
    const three = [out("a", 1), out("b", 2), out("+15551112222", 6)];
    expect(checkDrop(three, true, NOW)).toEqual({ ok: false, until: NOW + 1 * DAY });
    expect(checkDrop([out("a", 1), out("b", 2), out("c", 7)], true, NOW)).toEqual({ ok: true });
  });

  it("never limits drops to people in your circle, and they don't count", () => {
    const many = [out("a", 0), out("b", 0), out("c", 0), { to: "leo", at: NOW, outside: false }];
    expect(checkDrop(many, false, NOW)).toEqual({ ok: true });
    expect(checkDrop([{ to: "x", at: NOW, outside: false }, { to: "y", at: NOW, outside: false }, { to: "z", at: NOW, outside: false }], true, NOW)).toEqual({ ok: true });
  });
});

describe("who can drop in my mailbox (MAIL-10)", () => {
  it("offers anyone, friends of friends or only my circles, and starts at anyone", () => {
    expect(WHO_CAN_DROP).toEqual(["anyone", "friendsOfFriends", "circles"]);
    expect(DEFAULT_WHO_CAN_DROP).toBe("anyone");
    expect(isWhoCanDrop("circles")).toBe(true);
    expect(isWhoCanDrop("everyone")).toBe(false);
  });

  it("always lets your circles in; friends of friends needs a mutual friend", () => {
    for (const setting of WHO_CAN_DROP) expect(mailboxAllows(setting, { inCircle: true, mutualCount: 0 })).toBe(true);
    expect(mailboxAllows("anyone", { inCircle: false, mutualCount: 0 })).toBe(true);
    expect(mailboxAllows("friendsOfFriends", { inCircle: false, mutualCount: 1 })).toBe(true);
    expect(mailboxAllows("friendsOfFriends", { inCircle: false, mutualCount: 0 })).toBe(false);
    expect(mailboxAllows("circles", { inCircle: false, mutualCount: 3 })).toBe(false);
  });

  it("the directory says whether you can drop, by search and by account", async () => {
    const dir = fakeDirectory([
      { id: "kate", name: "Kate Morgan", username: "katem", phone: "+15550123456", findableByName: true, mutual: ["Leo"], look: { skin: "#F1C7A0", hair: "#B8562E", shirt: "#7A4E8C", bg: "#E6D3F0", ring: "#7A4E8C" } },
      { id: "theo", name: "Theo Park", username: "theop", phone: "+15550000000", findableByName: true, mutual: [], mailbox: "friendsOfFriends", look: { skin: "#F1C7A0", hair: "#8C8C8C", shirt: "#4F8F8B", bg: "#F6D9A8", ring: "#4F8F8B" } },
    ]);
    expect((await dir.search({ kind: "name", text: "kate" }))[0].canDrop).toBe(true);
    expect((await dir.search({ kind: "name", text: "theo" }))[0].canDrop).toBe(false);
    expect(await dir.canDropTo("kate")).toBe(true);
    expect(await dir.canDropTo("theo")).toBe(false);
  });
});

describe("portable (MAIL-9)", () => {
  const DIR = path.join(__dirname, "../../src/app/intro/mail");
  const PLATFORM = ["local-mail.ts", "local-find-me.ts", "local-mailbox-setting.ts", "browser-share.ts", "use-find-me.ts", "use-saved-setting.ts", "local-inbox.ts", "use-inbox.ts"];
  const logic = readdirSync(DIR).filter((f) => f.endsWith(".ts") && !PLATFORM.includes(f));

  it("has the logic files, with server TODOs on the interfaces", () => {
    expect(logic).toEqual(expect.arrayContaining(["find-query.ts", "directory.ts", "drop-limits.ts", "mail.ts", "find-me.ts", "mailbox-setting.ts", "inbox.ts"]));
    for (const f of ["directory.ts", "mail.ts", "find-me.ts", "mailbox-setting.ts", "inbox.ts"]) expect(readFileSync(path.join(DIR, f), "utf8")).toContain("TODO(server)");
  });

  it.each(logic)("%s uses no React or browser APIs", (file) => {
    const source = readFileSync(path.join(DIR, file), "utf8");
    expect(source).not.toMatch(/from "(react|next|@\/)/);
    expect(source).not.toMatch(/\b(window|document|localStorage|sessionStorage|indexedDB|navigator)\b/);
  });
});
