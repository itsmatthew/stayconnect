import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import type { OrnamentState } from "@/app/intro/ornaments/ornaments";

let n = 0;
const fresh = () => openOrnamentStore(`ornament-store-${++n}`);

describe("ornament store (HOME-15/17)", () => {
  it("starts empty", async () => {
    const store = await fresh();
    expect(await store.load()).toEqual({});
    store.close();
  });

  it("keeps the state across opens", async () => {
    const name = `ornament-store-${++n}`;
    const state: OrnamentState = { "g/0": { current: { photoId: "p", caption: "c", by: "me", at: 1 }, previous: "original" } };
    const a = await openOrnamentStore(name);
    await a.save(state);
    a.close();
    const b = await openOrnamentStore(name);
    expect(await b.load()).toEqual(state);
    b.close();
  });

  it("stores images by id and deletes them", async () => {
    const store = await fresh();
    const id = await store.putImage(new Blob(["jpeg"], { type: "image/jpeg" }));
    expect(await store.image(id)).toBeTruthy();
    await store.deleteImage(id);
    expect(await store.image(id)).toBeUndefined();
    store.close();
  });
});
