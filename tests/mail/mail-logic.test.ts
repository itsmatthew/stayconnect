import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkDrop, type DropRecord } from "@/app/intro/mail/drop-limits";
import { fakeDirectory } from "@/app/intro/mail/directory";
import { formatPhone, normalizePhone, parseFindQuery } from "@/app/intro/mail/find-query";

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
    { id: "theo", name: "Theo Park", username: "theop", phone: "+15550000000", findableByName: false, mutual: [], look: { skin: "#F1C7A0", hair: "#8C8C8C", shirt: "#4F8F8B", bg: "#F6D9A8", ring: "#4F8F8B" } },
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

  it("returns only a minimal card: photo, name, username and mutual friends", async () => {
    const [kate] = await dir.search({ kind: "name", text: "kate" });
    expect(Object.keys(kate).sort()).toEqual(["id", "look", "mutual", "name", "username"]);
    expect(kate.mutual).toEqual({ count: 2, names: ["Leo", "Ana"] });
  });

  it("never lists anyone by phone number: a number is only used when dropping", async () => {
    expect(await dir.search({ kind: "phone", phone: "+15550123456" })).toEqual([]);
    expect(await dir.accountFor("+15550123456")).toBe("kate");
    expect(await dir.accountFor("+15559999999")).toBeUndefined();
  });
});

describe("limits on drops outside your circle (MAIL-6)", () => {
  const out = (to: string, daysAgo: number): DropRecord => ({ to, at: NOW - daysAgo * DAY, outside: true });

  it("allows one drop to the same person every 14 days", () => {
    expect(checkDrop([out("kate", 13)], "kate", true, NOW)).toEqual({ ok: false, reason: "person", until: NOW + 1 * DAY });
    expect(checkDrop([out("kate", 14)], "kate", true, NOW)).toEqual({ ok: true });
  });

  it("allows three drops outside your circle in any 7 days, invites included", () => {
    const three = [out("a", 1), out("b", 2), out("+15551112222", 6)];
    expect(checkDrop(three, "d", true, NOW)).toEqual({ ok: false, reason: "week", until: NOW + 1 * DAY });
    expect(checkDrop([out("a", 1), out("b", 2), out("c", 7)], "d", true, NOW)).toEqual({ ok: true });
  });

  it("never limits drops to people in your circle, and they don't count", () => {
    const many = [out("a", 0), out("b", 0), out("c", 0), { to: "leo", at: NOW, outside: false }];
    expect(checkDrop(many, "leo", false, NOW)).toEqual({ ok: true });
    expect(checkDrop([{ to: "x", at: NOW, outside: false }, { to: "y", at: NOW, outside: false }, { to: "z", at: NOW, outside: false }], "d", true, NOW)).toEqual({ ok: true });
  });
});

describe("portable (MAIL-9)", () => {
  const DIR = path.join(__dirname, "../../src/app/intro/mail");
  const PLATFORM = ["local-mail.ts", "local-find-me.ts", "browser-share.ts", "use-find-me.ts"];
  const logic = readdirSync(DIR).filter((f) => f.endsWith(".ts") && !PLATFORM.includes(f));

  it("has the logic files, with server TODOs on the interfaces", () => {
    expect(logic).toEqual(expect.arrayContaining(["find-query.ts", "directory.ts", "drop-limits.ts", "mail.ts", "find-me.ts"]));
    for (const f of ["directory.ts", "mail.ts", "find-me.ts"]) expect(readFileSync(path.join(DIR, f), "utf8")).toContain("TODO(server)");
  });

  it.each(logic)("%s uses no React or browser APIs", (file) => {
    const source = readFileSync(path.join(DIR, file), "utf8");
    expect(source).not.toMatch(/from "(react|next|@\/)/);
    expect(source).not.toMatch(/\b(window|document|localStorage|sessionStorage|indexedDB|navigator)\b/);
  });
});
