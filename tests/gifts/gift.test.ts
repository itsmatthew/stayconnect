import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { canContinue, canOpenStep, giftCharge, giftCopies, clampNote, dateStampAllowed, dayKey, dayLabel, giftReducer, newGift, noteLength, NOTE_MAX, previousStep, nextStep, stampCode, STEPS, writtenDate, type Gift } from "@/app/intro/gifts/gift";
import { FRAMES, HANDS, INKS, RIBBONS, STAMPS, WRAPS, isAvailable } from "@/app/intro/gifts/gift-catalog";
import { giftRecipients } from "@/app/intro/gifts/gift-recipients";

const NOW = new Date(2026, 10, 6, 12).getTime();
const TODAY = dayKey(NOW);
const start = () => newGift({ id: "g1", from: "me", now: NOW });
const photo = { kind: "stored", photoId: "p1" } as const;
const complete = (): Gift => giftReducer(giftReducer(start(), { type: "to", to: { kind: "person", id: "leo" } }), { type: "photo", photo, takenAt: new Date(2019, 4, 2).getTime() });

describe("steps (GIFT-2)", () => {
  it("runs To, Photo, Frame, Note, Wrap", () => {
    expect(STEPS).toEqual(["to", "photo", "frame", "note", "wrap"]);
    expect(nextStep("to")).toBe("photo");
    expect(nextStep("wrap")).toBeUndefined();
    expect(previousStep("photo")).toBe("to");
    expect(previousStep("to")).toBeUndefined();
  });

  it("needs a person, then a photo, and nothing else", () => {
    expect(canContinue(start(), TODAY)).toBe(false);
    const withPerson = giftReducer(start(), { type: "to", to: { kind: "person", id: "leo" } });
    expect(canContinue(withPerson, TODAY)).toBe(true);
    const onPhoto = giftReducer(withPerson, { type: "step", step: "photo" });
    expect(canContinue(onPhoto, TODAY)).toBe(false);
    expect(canContinue(giftReducer(onPhoto, { type: "photo", photo }), TODAY)).toBe(true);
    for (const step of ["frame", "note"] as const) expect(canContinue(giftReducer(complete(), { type: "step", step }), TODAY)).toBe(true);
  });

  it("opens any step up to the first unfinished one", () => {
    expect(canOpenStep(start(), "to", TODAY)).toBe(true);
    expect(canOpenStep(start(), "photo", TODAY)).toBe(false);
    const withPerson = giftReducer(start(), { type: "to", to: { kind: "person", id: "leo" } });
    expect(canOpenStep(withPerson, "photo", TODAY)).toBe(true);
    expect(canOpenStep(withPerson, "frame", TODAY)).toBe(false);
    expect(canOpenStep(complete(), "wrap", TODAY)).toBe(true);
  });

  it("keeps everything when moving between steps", () => {
    const g = giftReducer(giftReducer(complete(), { type: "note", text: "hi" }), { type: "step", step: "to" });
    expect(g.note.text).toBe("hi");
    expect(g.photo).toEqual(photo);
  });
});

describe("date stamp (GIFT-6)", () => {
  it("is on by default for a dated photo", () => {
    expect(complete().frame.dateStamp).toBe(true);
    expect(dateStampAllowed(complete())).toBe(true);
  });

  it("is off and can't be turned on for a photo dated only by its file, or with no date", () => {
    const start2 = giftReducer(start(), { type: "to", to: { kind: "person", id: "leo" } });
    for (const g of [giftReducer(start2, { type: "photo", photo, takenAt: NOW, fileDated: true }), giftReducer(start2, { type: "photo", photo })]) {
      expect(dateStampAllowed(g)).toBe(false);
      expect(g.frame.dateStamp).toBe(false);
      expect(giftReducer(g, { type: "dateStamp", on: true }).frame.dateStamp).toBe(false);
    }
  });

  it("turns off when the photo changes to one without a date", () => {
    expect(giftReducer(complete(), { type: "photo", photo: { kind: "stored", photoId: "p2" }, takenAt: NOW, fileDated: true }).frame.dateStamp).toBe(false);
  });

  it("formats the printed stamp and the written date", () => {
    const t = new Date(2026, 10, 5).getTime();
    expect(stampCode(t)).toBe("11 05 '26");
    expect(writtenDate(t)).toBe("Nov 5, 2026");
  });
});

describe("note (GIFT-7)", () => {
  it("allows 140 characters, cuts the rest, and counts an emoji once", () => {
    expect(NOTE_MAX).toBe(140);
    expect(clampNote("a".repeat(141))).toHaveLength(140);
    expect(noteLength("🏀".repeat(140))).toBe(140);
    expect(noteLength(clampNote("🏀".repeat(141)))).toBe(140);
    expect(giftReducer(start(), { type: "note", text: "a".repeat(200) }).note.text).toHaveLength(140);
  });

  it("may be empty", () => {
    expect(canContinue(giftReducer(complete(), { type: "step", step: "note" }), TODAY)).toBe(true);
  });
});

describe("wrap (GIFT-8)", () => {
  const onWrap = () => giftReducer(complete(), { type: "step", step: "wrap" });

  it("opens right away by default", () => {
    expect(onWrap().opens).toEqual({ kind: "now" });
    expect(canContinue(onWrap(), TODAY)).toBe(true);
  });

  it("needs a chosen day to be after today", () => {
    const on = (day: string) => giftReducer(onWrap(), { type: "opens", opens: { kind: "on", day } });
    expect(canContinue(on("2026-11-07"), TODAY)).toBe(true);
    expect(canContinue(on(TODAY), TODAY)).toBe(false);
    expect(canContinue(on("2026-11-01"), TODAY)).toBe(false);
    expect(canContinue(on(""), TODAY)).toBe(false);
  });

  it("uses local days", () => {
    expect(dayKey(new Date(2026, 0, 3, 23, 30).getTime())).toBe("2026-01-03");
    expect(dayLabel("2026-11-12")).toBe("Thu, Nov 12");
  });
});

describe("catalog (GIFT-10)", () => {
  const all = [FRAMES, HANDS, INKS, STAMPS, WRAPS, RIBBONS];

  it("has the designed choices", () => {
    expect(FRAMES.map((f) => f.label)).toEqual(["Classic", "Instant", "Album", "Film", "Wood", "November"]);
    expect(WRAPS).toHaveLength(6);
    expect(RIBBONS).toHaveLength(4);
    expect(INKS).toHaveLength(4);
    expect(STAMPS).toHaveLength(4);
    expect(HANDS).toHaveLength(3);
  });

  it("says free or paid on every item, and all are free for now", () => {
    for (const list of all) for (const item of list) {
      expect(item.access).toEqual({ kind: "free" });
      expect(isAvailable(item)).toBe(true);
    }
    expect(isAvailable({ access: { kind: "paid", sku: "wrap.gold" } })).toBe(false);
  });

  it("stores ids on a gift, not looks", () => {
    const g = start();
    for (const id of [g.frame.id, g.note.hand, g.note.ink, g.note.stamp, g.wrap.pattern, g.wrap.ribbon]) expect(id).toMatch(/^[a-z]+$/);
  });
});

describe("recipients (GIFT-4)", () => {
  const friends = [
    { id: "a", name: "Ana" },
    { id: "b", name: "Bea" },
    { id: "c", name: "Cal" },
    { id: "d", name: "Dev" },
  ];
  const groups = [
    { id: "hoops", name: "Hoops", members: ["a", "b"] },
    { id: "devs", name: "Devs", members: ["d"] },
    { id: "alone", name: "Just me", members: [] },
  ];
  const placements = { b: "branches", a: "nest", c: "bloom" } as const;
  const people = { friends, groups, placements };

  it("sorts people by ring, with bloom and unplaced people in everyone", () => {
    const r = giftRecipients(people, "");
    expect(r.nest.map((f) => f.id)).toEqual(["a"]);
    expect(r.branches.map((f) => f.id)).toEqual(["b"]);
    expect(r.everyone.map((f) => f.id)).toEqual(["c", "d"]);
  });

  it("offers groups in their own order, leaving out one with nobody to receive it", () => {
    expect(giftRecipients(people, "").groups.map((g) => g.id)).toEqual(["hoops", "devs"]);
  });

  it("searches groups and everyone, ignoring case", () => {
    const r = giftRecipients(people, " DE ");
    expect([...r.nest, ...r.branches, ...r.everyone].map((f) => f.id)).toEqual(["d"]);
    expect(r.groups.map((g) => g.id)).toEqual(["devs"]);
  });
});

describe("group gifts (GIFT-13)", () => {
  const toGroup = giftReducer(start(), { type: "to", to: { kind: "group", id: "hoops" } });
  const toPerson = giftReducer(start(), { type: "to", to: { kind: "person", id: "leo" } });
  const membersOf = (id: string) => ({ hoops: ["sam", "jordan", "leo"] })[id] ?? [];

  it("can go to a group or a person, and either finishes the To step", () => {
    expect(toGroup.to).toEqual({ kind: "group", id: "hoops" });
    expect(canContinue(toGroup, TODAY)).toBe(true);
    expect(canContinue(toPerson, TODAY)).toBe(true);
  });

  it("costs one price in total, the same as a gift to one person", () => {
    expect(giftCharge(toGroup)).toEqual({ idempotencyKey: "g1", sku: "gift.single", quantity: 1 });
    expect(giftCharge(toGroup)).toEqual(giftCharge(toPerson));
  });

  it("gives each member their own copy, to unwrap and keep separately", () => {
    const copies = giftCopies(toGroup, membersOf);
    expect(copies.map((c) => c.to)).toEqual(["sam", "jordan", "leo"]);
    expect(new Set(copies.map((c) => c.id)).size).toBe(3);
    for (const c of copies) expect(c.giftId).toBe("g1");
  });

  it("gives a person one copy", () => {
    expect(giftCopies(toPerson, membersOf).map((c) => c.to)).toEqual(["leo"]);
  });

  it("never gives the sender a copy, or a member two", () => {
    expect(giftCopies(toGroup, () => ["me", "sam", "sam"]).map((c) => c.to)).toEqual(["sam"]);
  });

  it("has no copies before anyone is picked", () => {
    expect(giftCopies(start(), membersOf)).toEqual([]);
  });
});

describe("portable (GIFT-12)", () => {
  const DIR = path.join(__dirname, "../../src/app/intro/gifts");
  const PLATFORM = ["local-gift-store.ts", "local-gift-events.ts", "use-gift-draft.ts"];
  const logic = readdirSync(DIR).filter((f) => f.endsWith(".ts") && !PLATFORM.includes(f));

  it("has the logic files, with server TODOs on the interfaces", () => {
    expect(logic).toEqual(expect.arrayContaining(["gift.ts", "gift-catalog.ts", "gift-recipients.ts", "gift-store.ts", "gift-events.ts"]));
    for (const f of ["gift-store.ts", "gift-events.ts"]) expect(readFileSync(path.join(DIR, f), "utf8")).toContain("TODO(server)");
  });

  it.each(logic)("%s uses no React or browser APIs", (file) => {
    const source = readFileSync(path.join(DIR, file), "utf8");
    expect(source).not.toMatch(/from "(react|next|@\/)/);
    expect(source).not.toMatch(/\b(window|document|localStorage|sessionStorage|indexedDB|navigator)\b/);
  });
});
