import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { clearOverride, parseOverrides, setOverride, type ColorOverrideStore } from "@/app/intro/colors/color-overrides";
import { colorOverridesKey, localColorOverrideStore } from "@/app/intro/colors/local-color-overrides";
import { useColorOverrides } from "@/app/intro/colors/use-color-overrides";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("overrides (COLOR-7)", () => {
  it("sets and clears without touching the input", () => {
    const start = { a: "red" };
    expect(setOverride(start, "b", "blue")).toEqual({ a: "red", b: "blue" });
    expect(clearOverride(start, "a")).toEqual({});
    expect(start).toEqual({ a: "red" });
  });

  it("keeps only string entries when parsing", () => {
    expect(parseOverrides({ a: "red", b: 3, c: null })).toEqual({ a: "red" });
    for (const bad of [null, 3, "red", ["red"]]) expect(parseOverrides(bad)).toEqual({});
  });
});

describe("localStorage adapter (COLOR-8)", () => {
  it("round-trips", async () => {
    const store = localColorOverrideStore("");
    await store.save({ a: "teal" });
    expect(await localColorOverrideStore("").load()).toEqual({ a: "teal" });
  });

  it("keeps demo and real overrides apart (DEMO-3)", async () => {
    expect(colorOverridesKey("")).toBe("nowandthen.groupColors.v1");
    expect(colorOverridesKey(".demo")).toBe("nowandthen.groupColors.v1.demo");
    await localColorOverrideStore(".demo").save({ a: "teal" });
    expect(await localColorOverrideStore("").load()).toEqual({});
  });

  it("treats missing or corrupt data as no overrides", async () => {
    expect(await localColorOverrideStore("").load()).toEqual({});
    localStorage.setItem(colorOverridesKey(""), "{not json");
    expect(await localColorOverrideStore("").load()).toEqual({});
  });

  it("survives blocked storage", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = localColorOverrideStore("");
    expect(await store.load()).toEqual({});
    await expect(store.save({ a: "teal" })).resolves.toBeUndefined();
  });
});

describe("useColorOverrides (COLOR-8)", () => {
  const fakeStore = (saved = {}): ColorOverrideStore & { saves: unknown[] } => {
    const saves: unknown[] = [];
    return { saves, load: async () => saved, save: async (o) => void saves.push(o) };
  };

  it("loads what's saved", async () => {
    const { result } = renderHook(() => useColorOverrides(fakeStore({ a: "teal" })));
    await waitFor(() => expect(result.current[0]).toEqual({ a: "teal" }));
  });

  it("applies and saves a change, then clears it", async () => {
    const store = fakeStore();
    const { result } = renderHook(() => useColorOverrides(store));
    act(() => result.current[1]("a", "teal"));
    expect(result.current[0]).toEqual({ a: "teal" });
    act(() => result.current[1]("a", null));
    expect(result.current[0]).toEqual({});
    expect(store.saves).toEqual([{ a: "teal" }, {}]);
  });

  it("doesn't let a slow load overwrite a change made first", async () => {
    let finish: (o: Record<string, string>) => void = () => {};
    const store: ColorOverrideStore = { load: () => new Promise((r) => (finish = r)), save: async () => {} };
    const { result } = renderHook(() => useColorOverrides(store));
    act(() => result.current[1]("a", "teal"));
    await act(async () => finish({ b: "red" }));
    expect(result.current[0]).toEqual({ a: "teal" });
  });
});
