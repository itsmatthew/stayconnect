import { describe, expect, it } from "vitest";
import { dayKey, giftReducer, newGift, type Gift } from "@/app/intro/gifts/gift";
import { canOpen, copyOf, openGift, receiveGift, shelf, waiting, wrappedLine, type ReceivedGift } from "@/app/intro/gifts/received";

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 11, 12).getTime();
const TODAY = dayKey(NOW);
const photo = { kind: "art", art: "basketball" } as const;

const sent = (over: Partial<Gift> = {}): Gift => ({
  ...giftReducer(giftReducer(newGift({ id: "g1", from: "harry", now: NOW - DAY }), { type: "to", to: { kind: "person", id: "me" } }), { type: "photo", photo, takenAt: new Date(2019, 4, 2).getTime() }),
  note: { text: "Studs.", hand: "script", ink: "red", stamp: "heart" },
  wrap: { pattern: "gingham", ribbon: "navy" },
  frame: { id: "instant", dateStamp: true },
  ...over,
});
const gift = (id: string, sentAt: number, over: Partial<ReceivedGift> = {}): ReceivedGift => ({ ...copyOf(sent(), { id, giftId: "g1", to: "me" }, { id: "harry", name: "Harry" }, sentAt), ...over });

describe("a received gift is the gift as it was made (GIFT-18)", () => {
  it("keeps the sender's photo, frame, note, handwriting, ink, stamp, paper and ribbon", () => {
    const g = gift("g1/me", NOW);
    expect(g).toMatchObject({ id: "g1/me", giftId: "g1", from: { id: "harry", name: "Harry" }, photo, frame: { id: "instant", dateStamp: true }, note: { text: "Studs.", hand: "script", ink: "red", stamp: "heart" }, wrap: { pattern: "gingham", ribbon: "navy" }, sentAt: NOW });
    expect(g.openedAt).toBeUndefined();
  });

  it("says when it was wrapped, and who it's for", () => {
    expect(wrappedLine(gift("a", new Date(2026, 10, 5).getTime()))).toBe("wrapped Nov 5 · just for you");
  });
});

describe("waiting to pop up, then the shelf (GIFT-19, GIFT-21)", () => {
  it("unopened gifts wait to pop up, oldest first", () => {
    const list = [gift("old", NOW - 3 * DAY), gift("new", NOW - 1000), gift("mid", NOW - DAY, { openedAt: NOW - 10 })];
    expect(waiting(list, TODAY).map((g) => g.id)).toEqual(["old", "new"]);
  });

  it("a gift for a later day doesn't pop up until that day", () => {
    const list = [gift("later", NOW - DAY, { opens: { kind: "on", day: "2026-11-14" } }), gift("now", NOW)];
    expect(waiting(list, TODAY).map((g) => g.id)).toEqual(["now"]);
    expect(waiting(list, "2026-11-14").map((g) => g.id)).toEqual(["later", "now"]);
  });

  it("opening moves it to the shelf, newest opened first, and only once", () => {
    let list = [gift("a", NOW - 2 * DAY), gift("b", NOW - DAY)];
    list = openGift(list, "a", NOW - 100, TODAY);
    list = openGift(list, "b", NOW, TODAY);
    expect(shelf(list).map((g) => g.id)).toEqual(["b", "a"]);
    expect(waiting(list, TODAY)).toEqual([]);
    expect(openGift(list, "a", NOW + 5000, TODAY).find((g) => g.id === "a")!.openedAt).toBe(NOW - 100);
  });

  it("a gift for a later day can't be opened before that day", () => {
    const later = gift("later", NOW, { opens: { kind: "on", day: "2026-11-14" } });
    expect(canOpen(later, TODAY)).toBe(false);
    expect(canOpen(later, "2026-11-14")).toBe(true);
    expect(openGift([later], "later", NOW, TODAY)[0].openedAt).toBeUndefined();
    expect(canOpen(gift("now", NOW), TODAY)).toBe(true);
  });

  it("receiving adds a gift once, wrapped", () => {
    const g = gift("x", NOW, { openedAt: NOW });
    const list = receiveGift(receiveGift([], g), g);
    expect(list).toHaveLength(1);
    expect(list[0].openedAt).toBeUndefined();
  });
});
