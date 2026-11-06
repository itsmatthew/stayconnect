import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { giftReducer, newGift, type Gift } from "@/app/intro/gifts/gift";
import type { GiftEvent, GiftEvents } from "@/app/intro/gifts/gift-events";
import type { GiftStore } from "@/app/intro/gifts/gift-store";
import { parseGifts } from "@/app/intro/gifts/gift-store";
import { giftEventsKey, localGiftEvents } from "@/app/intro/gifts/local-gift-events";
import { giftsKey, localGiftStore } from "@/app/intro/gifts/local-gift-store";
import { useGiftDraft } from "@/app/intro/gifts/use-gift-draft";

const NOW = new Date(2026, 10, 6, 12).getTime();
const gift = (id = "g1") => giftReducer(newGift({ id, from: "me", now: NOW }), { type: "to", friendId: "leo" });

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("local store (GIFT-9)", () => {
  it("adds and replaces by id", async () => {
    const store = localGiftStore("");
    await store.save(gift("a"));
    await store.save(gift("b"));
    await store.save(giftReducer(gift("a"), { type: "note", text: "hi" }));
    const saved = await localGiftStore("").load();
    expect(saved.map((g) => g.id)).toEqual(["a", "b"]);
    expect(saved[0].note.text).toBe("hi");
  });

  it("keeps demo and real gifts apart (DEMO-3)", async () => {
    expect(giftsKey(".demo")).toBe("nowandthen.gifts.v1.demo");
    await localGiftStore(".demo").save(gift());
    expect(await localGiftStore("").load()).toEqual([]);
  });

  it("treats corrupt data as no gifts", async () => {
    localStorage.setItem(giftsKey(""), "{nope");
    expect(await localGiftStore("").load()).toEqual([]);
    expect(parseGifts([{ id: 3 }, null, gift()]).map((g) => g.id)).toEqual(["g1"]);
    expect(parseGifts("x")).toEqual([]);
  });
});

describe("local events (GIFT-11)", () => {
  it("appends, under its own key", async () => {
    expect(giftEventsKey(".demo")).toBe("nowandthen.giftEvents.v1.demo");
    const events = localGiftEvents("");
    await events.record({ type: "made", giftId: "g", at: 1 });
    await events.record({ type: "abandoned", giftId: "g", step: "note", at: 2 });
    expect(JSON.parse(localStorage.getItem(giftEventsKey(""))!)).toHaveLength(2);
  });

  it("never gets in the way when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    await expect(localGiftEvents("").record({ type: "made", giftId: "g", at: 1 })).resolves.toBeUndefined();
  });
});

describe("useGiftDraft (GIFT-9, GIFT-11)", () => {
  const fakes = (saved: Gift[] = []) => {
    const saves: Gift[] = [];
    const recorded: GiftEvent[] = [];
    const store: GiftStore = { load: async () => saved, save: async (g) => void saves.push(g) };
    const events: GiftEvents = { record: async (e) => void recorded.push(e) };
    return { store, events, saves, recorded };
  };
  const setup = (f: ReturnType<typeof fakes>) => renderHook(() => useGiftDraft({ store: f.store, events: f.events, now: () => NOW, makeId: () => "new", from: "me" }));

  it("starts a fresh gift, and saves nothing until a person is picked", async () => {
    const f = fakes();
    const { result } = setup(f);
    await act(() => result.current.open());
    expect(result.current.gift?.id).toBe("new");
    act(() => result.current.dispatch({ type: "step", step: "to" }));
    expect(f.saves).toEqual([]);
    expect(f.recorded).toEqual([]);
  });

  it("saves every change from the first pick, and records made once", async () => {
    const f = fakes();
    const { result } = setup(f);
    await act(() => result.current.open());
    act(() => result.current.dispatch({ type: "to", friendId: "leo" }));
    act(() => result.current.dispatch({ type: "note", text: "hi" }));
    expect(f.saves.map((g) => g.note.text)).toEqual(["", "hi"]);
    expect(f.recorded).toEqual([{ type: "made", giftId: "new", at: NOW }]);
  });

  it("picks up the newest draft on the same step", async () => {
    const older = giftReducer(gift("old"), { type: "step", step: "note" });
    const newer = { ...giftReducer(gift("mine"), { type: "step", step: "frame" }), createdAt: NOW + 1 };
    const f = fakes([older, newer]);
    const { result } = setup(f);
    await act(() => result.current.open());
    expect(result.current.gift?.id).toBe("mine");
    expect(result.current.gift?.step).toBe("frame");
  });

  it("ignores gifts already on their way", async () => {
    const f = fakes([{ ...gift("sent"), status: "sent" }]);
    const { result } = setup(f);
    await act(() => result.current.open());
    expect(result.current.gift?.id).toBe("new");
  });

  it("records abandoned on close only when there's a gift to keep, and keeps it", async () => {
    const f = fakes();
    const { result } = setup(f);
    await act(() => result.current.open());
    act(() => result.current.close());
    expect(f.recorded).toEqual([]);
    await act(() => result.current.open());
    act(() => result.current.dispatch({ type: "to", friendId: "leo" }));
    act(() => result.current.close());
    expect(result.current.gift).toBeNull();
    expect(f.recorded.at(-1)).toEqual({ type: "abandoned", giftId: "new", step: "to", at: NOW });
    await waitFor(() => expect(f.saves).toHaveLength(1));
  });
});
